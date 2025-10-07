const { pgCore } = require('../../config/database')

class TaskAttachmentsRepository {
  async getTaskAttachments(taskId, filters = {}) {
    const query = pgCore('task_attachments as ta')
      .select([
        'ta.*',
        'u.first_name as uploader_first_name',
        'u.last_name as uploader_last_name'
      ])
      .leftJoin('users as u', 'ta.user_id', 'u.id')
      .where('ta.task_id', taskId)
      .orderBy('ta.created_at', 'desc')

    if (filters.file_type) {
      query.where('ta.file_type', filters.file_type)
    }
    if (filters.limit) {
      query.limit(filters.limit)
    }
    if (filters.offset) {
      query.offset(filters.offset)
    }

    return await query
  }

  async createAttachment(taskId, attachmentData, userId) {
    const [attachment] = await pgCore('task_attachments')
      .insert({
        task_id: taskId,
        user_id: userId,
        file_name: attachmentData.file_name,
        original_name: attachmentData.original_name,
        file_path: attachmentData.file_path,
        file_size: attachmentData.file_size,
        mime_type: attachmentData.mime_type,
        file_type: attachmentData.file_type,
        description: attachmentData.description,
        is_public: attachmentData.is_public !== undefined ? attachmentData.is_public : true
      })
      .returning('*')

    return attachment
  }

  async updateAttachment(attachmentId, attachmentData, userId) {
    const updateData = {}

    if (attachmentData.description !== undefined) {
      updateData.description = attachmentData.description
    }
    if (attachmentData.is_public !== undefined) {
      updateData.is_public = attachmentData.is_public
    }

    const [attachment] = await pgCore('task_attachments')
      .where('id', attachmentId)
      .where('user_id', userId) // Only uploader can update
      .update(updateData)
      .returning('*')

    return attachment
  }

  async deleteAttachment(attachmentId, userId) {
    const attachment = await pgCore('task_attachments')
      .where('id', attachmentId)
      .where('user_id', userId) // Only uploader can delete
      .first()

    if (!attachment) {
      return null
    }

    await pgCore('task_attachments')
      .where('id', attachmentId)
      .del()

    return attachment
  }

  async getAttachment(attachmentId) {
    const attachment = await pgCore('task_attachments as ta')
      .select([
        'ta.*',
        'u.first_name as uploader_first_name',
        'u.last_name as uploader_last_name'
      ])
      .leftJoin('users as u', 'ta.user_id', 'u.id')
      .where('ta.id', attachmentId)
      .first()

    return attachment
  }

  async getAttachmentStats(taskId) {
    const stats = await pgCore('task_attachments')
      .where('task_id', taskId)
      .select([
        pgCore.raw('COUNT(*) as total_files'),
        pgCore.raw('SUM(file_size) as total_size'),
        pgCore.raw('COUNT(CASE WHEN file_type = \'image\' THEN 1 END) as image_count'),
        pgCore.raw('COUNT(CASE WHEN file_type = \'document\' THEN 1 END) as document_count'),
        pgCore.raw('COUNT(CASE WHEN file_type = \'video\' THEN 1 END) as video_count')
      ])
      .first()

    return stats
  }

  async checkTaskAccess(taskId, userId) {
    // Check if user has access to this task
    const task = await pgCore('tasks as t')
      .select('t.*')
      .leftJoin('task_members as tm', function() {
        this.on('t.id', '=', 'tm.task_id')
      })
      .where('t.id', taskId)
      .where(function() {
        this.where('t.created_by', userId)
          .orWhere('tm.user_id', userId)
      })
      .first()

    return !!task
  }
}

module.exports = new TaskAttachmentsRepository()
