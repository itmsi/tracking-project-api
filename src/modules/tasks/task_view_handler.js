const { response } = require('../../utils')
const taskDetailsRepository = require('./task_details_repository')
const taskChatRepository = require('./task_chat_repository')
const taskAttachmentsRepository = require('./task_attachments_repository')
const taskMembersRepository = require('./task_members_repository')
const taskRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')
const { createChatNotifications, createReplyNotification } = require('../../utils/chat_notification')
const { uploadToMinio, isMinioEnabled } = require('../../config/minio')
const fs = require('fs')
const path = require('path')

class TaskViewHandler {
  // Get complete task view with all details
  async getTaskView(req, res, next) {
    try {
      console.log('=== Handler getTaskView START ===');
      const userId = req.user.id
      const { id } = req.params
      console.log('UserId:', userId);
      console.log('Task ID:', id);

      // Check if user has access to this task
      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      console.log('Has Access:', hasAccess.hasAccess);
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat task ini')
      }

      // Get task basic info
      const task = await taskRepository.getTaskById(id, userId)
      if (!task) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      // Get task details
      const taskDetails = await taskDetailsRepository.getTaskDetails(id, userId)

      // Get task members
      const taskMembers = await taskMembersRepository.getTaskMembers(id)

      // Get task attachments
      const taskAttachments = await taskAttachmentsRepository.getTaskAttachments(id, { limit: 10 })

      // Get recent chat messages
      const chatMessages = await taskChatRepository.getTaskChat(id, { limit: 20 })

      // Get stats
      const chatStats = await taskChatRepository.getChatStats(id)
      const attachmentStats = await taskAttachmentsRepository.getAttachmentStats(id)
      const memberStats = await taskMembersRepository.getTaskMemberStats(id)

      const taskView = {
        task,
        details: taskDetails,
        members: taskMembers,
        attachments: taskAttachments,
        chat: {
          messages: chatMessages,
          stats: chatStats
        },
        stats: {
          attachments: attachmentStats,
          members: memberStats
        },
        user_permissions: hasAccess
      }

      return response.success(res, 200, 'Task view berhasil diambil', taskView)
    } catch (error) {
      console.error('=== Handler getTaskView ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      next(error)
    }
  }

  // Task Details Management
  async getTaskDetails(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin', 'member'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat detail task ini')
      }

      const taskDetails = await taskDetailsRepository.getTaskDetails(id, userId)
      
      return response.success(res, 200, 'Task details berhasil diambil', taskDetails)
    } catch (error) {
      next(error)
    }
  }

  async createTaskDetails(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const detailsData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah detail task ini')
      }

      // Check if details already exist
      const existingDetails = await taskDetailsRepository.getTaskDetails(id, userId)
      if (existingDetails) {
        return response.error(res, 400, 'Task details sudah ada, gunakan update untuk mengubah')
      }

      const taskDetails = await taskDetailsRepository.createTaskDetails(id, detailsData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task_details',
        entity_id: taskDetails.id,
        new_values: taskDetails,
        description: `Task details dibuat untuk task "${id}"`
      })

      return response.success(res, 201, 'Task details berhasil dibuat', taskDetails)
    } catch (error) {
      next(error)
    }
  }

  async updateTaskDetails(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const detailsData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah detail task ini')
      }

      const taskDetails = await taskDetailsRepository.updateTaskDetails(id, detailsData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'task_details',
        entity_id: taskDetails.id,
        new_values: taskDetails,
        description: `Task details diubah untuk task "${id}"`
      })

      return response.success(res, 200, 'Task details berhasil diubah', taskDetails)
    } catch (error) {
      next(error)
    }
  }

  // Task Chat Management
  async getTaskChat(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { limit = 50, offset = 0 } = req.query

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat chat task ini')
      }

      const chatMessages = await taskChatRepository.getTaskChat(id, { limit: parseInt(limit), offset: parseInt(offset) })
      const chatStats = await taskChatRepository.getChatStats(id)

      return response.success(res, 200, 'Chat messages berhasil diambil', {
        messages: chatMessages,
        stats: chatStats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: chatStats.total_messages
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async createChatMessage(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const messageData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengirim chat di task ini')
      }

      // Check if user has comment permission
      if (hasAccess.permissions && !hasAccess.permissions.can_comment) {
        return response.error(res, 403, 'Tidak memiliki izin untuk mengirim chat')
      }

      const chatMessage = await taskChatRepository.createChatMessage(id, messageData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task_chat',
        entity_id: chatMessage.id,
        new_values: chatMessage,
        description: `Chat message dikirim di task "${id}"`
      })

      // Create notifications for task members (without WebSocket broadcast since this is HTTP)
      try {
        await createChatNotifications({
          taskId: id,
          senderId: userId,
          messageId: chatMessage.id,
          message: messageData.message,
          senderInfo: req.user,
          websocketBroadcast: null // No WebSocket in HTTP handler
        });

        // If it's a reply, create reply notification
        if (messageData.reply_to) {
          await createReplyNotification({
            taskId: id,
            senderId: userId,
            messageId: chatMessage.id,
            replyToMessageId: messageData.reply_to,
            message: messageData.message,
            websocketBroadcast: null
          });
        }

        console.log(`🔔 Notifications created for chat message via HTTP`);
      } catch (notifError) {
        console.error('⚠️  Failed to create notifications:', notifError.message);
        // Don't fail the whole operation if notifications fail
      }

      return response.success(res, 201, 'Chat message berhasil dikirim', chatMessage)
    } catch (error) {
      next(error)
    }
  }

  async updateChatMessage(req, res, next) {
    try {
      const userId = req.user.id
      const { id, messageId } = req.params
      const messageData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah chat di task ini')
      }

      const chatMessage = await taskChatRepository.updateChatMessage(messageId, messageData, userId)
      if (!chatMessage) {
        return response.error(res, 404, 'Chat message tidak ditemukan atau tidak memiliki izin untuk mengubah')
      }

      return response.success(res, 200, 'Chat message berhasil diubah', chatMessage)
    } catch (error) {
      next(error)
    }
  }

  async deleteChatMessage(req, res, next) {
    try {
      const userId = req.user.id
      const { id, messageId } = req.params

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menghapus chat di task ini')
      }

      const chatMessage = await taskChatRepository.deleteChatMessage(messageId, userId)
      if (!chatMessage) {
        return response.error(res, 404, 'Chat message tidak ditemukan atau tidak memiliki izin untuk menghapus')
      }

      return response.success(res, 200, 'Chat message berhasil dihapus', chatMessage)
    } catch (error) {
      next(error)
    }
  }

  // Task Attachments Management
  async getTaskAttachments(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { file_type, limit = 20, offset = 0 } = req.query

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat attachments task ini')
      }

      const attachments = await taskAttachmentsRepository.getTaskAttachments(id, {
        file_type,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
      const attachmentStats = await taskAttachmentsRepository.getAttachmentStats(id)

      return response.success(res, 200, 'Task attachments berhasil diambil', {
        attachments,
        stats: attachmentStats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: attachmentStats.total_files
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async uploadAttachment(req, res, next) {
    const startTime = Date.now()
    console.log('🚀 Task attachment upload started at:', new Date().toISOString())
    
    try {
      const userId = req.user.id
      const { id } = req.params

      console.log('👤 User ID:', userId)
      console.log('📋 Task ID:', id)

      // Check file uploaded
      if (!req.file) {
        console.log('❌ No file in request')
        return response.error(res, 400, 'File harus diisi')
      }

      console.log('📦 File received:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
        path: req.file.path
      })

      // Check access permission
      console.log('🔍 Checking user permission for task')
      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        console.log('❌ User does not have access to this task')
        return response.error(res, 403, 'Tidak memiliki akses untuk mengupload file di task ini')
      }

      // Check if user has upload permission
      if (hasAccess.permissions && !hasAccess.permissions.can_upload) {
        console.log('❌ User does not have upload permission')
        return response.error(res, 403, 'Tidak memiliki izin untuk mengupload file')
      }

      console.log('✅ Permission check passed')

      let fileUrl = req.file.path; // Default to local path
      let shouldDeleteLocalFile = false;

      // Upload to MinIO if enabled
      if (isMinioEnabled) {
        try {
          console.log('☁️  Uploading file to MinIO...')
          
          // Read file buffer
          const fileBuffer = fs.readFileSync(req.file.path);
          
          // Generate object name (path in MinIO)
          const objectName = `task_attachments/${id}/${req.file.filename}`;
          
          // Upload to MinIO
          const uploadResult = await uploadToMinio(
            objectName,
            fileBuffer,
            req.file.mimetype
          );

          if (uploadResult.success) {
            fileUrl = uploadResult.url;
            shouldDeleteLocalFile = true; // Delete local file after successful upload
            console.log('✅ File uploaded to MinIO:', fileUrl);
          } else {
            console.warn('⚠️  MinIO upload failed, using local path:', uploadResult.error);
            fileUrl = req.file.path; // Fallback to local path
          }
        } catch (minioError) {
          console.error('❌ Error uploading to MinIO:', minioError.message);
          console.log('⚠️  Falling back to local storage');
          fileUrl = req.file.path; // Fallback to local path
        }
      } else {
        console.log('ℹ️  MinIO disabled, using local storage');
      }

      // File upload will be handled by middleware
      const attachmentData = {
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_path: fileUrl, // Use MinIO URL or local path
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        file_type: req.body.file_type || 'document',
        description: req.body.description,
        is_public: req.body.is_public !== undefined ? req.body.is_public === 'true' : true
      }

      console.log('💾 Saving attachment to database:', {
        file_name: attachmentData.file_name,
        file_type: attachmentData.file_type,
        size: attachmentData.file_size,
        storage: isMinioEnabled ? 'MinIO' : 'Local',
        url: fileUrl
      })

      const attachment = await taskAttachmentsRepository.createAttachment(id, attachmentData, userId)
      console.log('✅ Attachment saved with ID:', attachment.id)

      // Delete local file if uploaded to MinIO successfully
      if (shouldDeleteLocalFile && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️  Local file deleted after MinIO upload');
        } catch (deleteError) {
          console.warn('⚠️  Could not delete local file:', deleteError.message);
        }
      }

      // Create activity log
      console.log('📝 Creating activity log')
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task_attachment',
        entity_id: attachment.id,
        new_values: attachment,
        description: `File "${attachment.original_name}" diupload ke task "${id}"`
      })
      console.log('✅ Activity log created')

      const duration = Date.now() - startTime
      console.log(`✅ Task attachment upload completed in ${duration}ms`)

      return response.success(res, 201, 'File berhasil diupload', attachment)
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ Task attachment upload failed after ${duration}ms:`, error.message)
      console.error('Error stack:', error.stack)
      
      // Clean up uploaded file if exists
      if (req.file && req.file.path) {
        const fs = require('fs')
        if (fs.existsSync(req.file.path)) {
          console.log('🗑️ Cleaning up file:', req.file.path)
          try {
            fs.unlinkSync(req.file.path)
            console.log('✅ File cleaned up')
          } catch (cleanupError) {
            console.error('❌ Error cleaning up file:', cleanupError.message)
          }
        }
      }
      
      next(error)
    }
  }

  async deleteAttachment(req, res, next) {
    try {
      const userId = req.user.id
      const { id, attachmentId } = req.params

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menghapus file di task ini')
      }

      const attachment = await taskAttachmentsRepository.deleteAttachment(attachmentId, userId)
      if (!attachment) {
        return response.error(res, 404, 'File tidak ditemukan atau tidak memiliki izin untuk menghapus')
      }

      return response.success(res, 200, 'File berhasil dihapus', attachment)
    } catch (error) {
      next(error)
    }
  }

  // Task Members Management
  async getTaskMembers(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { role, limit = 50, offset = 0 } = req.query

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId)
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat members task ini')
      }

      const members = await taskMembersRepository.getTaskMembers(id, {
        role,
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
      const memberStats = await taskMembersRepository.getTaskMemberStats(id)

      return response.success(res, 200, 'Task members berhasil diambil', {
        members,
        stats: memberStats,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: memberStats.total_members
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async addTaskMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const memberData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menambah member task ini')
      }

      const member = await taskMembersRepository.addTaskMember(id, memberData.user_id, memberData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task_member',
        entity_id: member.id,
        new_values: member,
        description: `Member ditambahkan ke task "${id}"`
      })

      return response.success(res, 201, 'Member berhasil ditambahkan', member)
    } catch (error) {
      if (error.message.includes('sudah menjadi member')) {
        return response.error(res, 400, error.message)
      }
      next(error)
    }
  }

  async updateTaskMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, memberId } = req.params
      const memberData = req.body

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah member task ini')
      }

      const member = await taskMembersRepository.updateTaskMember(id, memberId, memberData, userId)

      return response.success(res, 200, 'Member berhasil diubah', member)
    } catch (error) {
      next(error)
    }
  }

  async removeTaskMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, memberId } = req.params

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menghapus member task ini')
      }

      const member = await taskMembersRepository.removeTaskMember(id, memberId, userId)
      if (!member) {
        return response.error(res, 404, 'Member tidak ditemukan')
      }

      return response.success(res, 200, 'Member berhasil dihapus', member)
    } catch (error) {
      next(error)
    }
  }

  async searchUsersForTask(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { q, limit = 10 } = req.query

      const hasAccess = await taskMembersRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasAccess.hasAccess) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mencari users di task ini')
      }

      if (!q || q.length < 2) {
        return response.error(res, 400, 'Search term minimal 2 karakter')
      }

      const users = await taskMembersRepository.searchUsersForTask(id, q, parseInt(limit))

      return response.success(res, 200, 'Users berhasil dicari', users)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new TaskViewHandler()
