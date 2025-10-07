const { response } = require('../../utils')
const uploadRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueFileName = uploadRepository.generateUniqueFileName(file.originalname, req.user.id)
    cb(null, uniqueFileName)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: function (req, file, cb) {
    // Define allowed file types
    const allowedTypes = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/x-rar-compressed': '.rar'
    }

    if (allowedTypes[file.mimetype]) {
      cb(null, true)
    } else {
      cb(new Error('File type tidak didukung'), false)
    }
  }
})

class UploadHandler {
  // Middleware for file upload
  uploadMiddleware() {
    return upload.single('file')
  }

  async uploadFile(req, res, next) {
    try {
      const userId = req.user.id
      const { type, description, task_id, project_id } = req.body

      if (!req.file) {
        return response.error(res, 400, 'File harus diisi')
      }

      // Validate file access based on type
      if (type === 'task_attachment' && task_id) {
        const hasAccess = await uploadRepository.validateFileAccess(null, userId, 'task_attachment')
        if (!hasAccess) {
          // Delete uploaded file
          fs.unlinkSync(req.file.path)
          return response.error(res, 403, 'Tidak memiliki akses ke task ini')
        }
      }

      if (type === 'project_file' && project_id) {
        const hasAccess = await uploadRepository.validateFileAccess(null, userId, 'project_file')
        if (!hasAccess) {
          // Delete uploaded file
          fs.unlinkSync(req.file.path)
          return response.error(res, 403, 'Tidak memiliki akses ke project ini')
        }
      }

      // Move file from temp to permanent location
      const permanentDir = path.join(process.cwd(), 'uploads', type)
      if (!fs.existsSync(permanentDir)) {
        fs.mkdirSync(permanentDir, { recursive: true })
      }

      const permanentPath = path.join(permanentDir, req.file.filename)
      fs.renameSync(req.file.path, permanentPath)

      // Save file record to database
      const fileData = {
        user_id: userId,
        original_name: req.file.originalname,
        file_name: req.file.filename,
        file_path: path.join(type, req.file.filename),
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        type,
        description,
        task_id,
        project_id
      }

      const file = await uploadRepository.createFileRecord(fileData)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'file_upload',
        entity_id: file.id,
        new_values: file,
        description: `File "${file.original_name}" diupload`
      })

      return response.success(res, 201, 'File berhasil diupload', file)
    } catch (error) {
      // Clean up uploaded file if exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      next(error)
    }
  }

  async getFiles(req, res, next) {
    try {
      const userId = req.user.id
      const filters = req.query

      const result = await uploadRepository.getFiles(userId, filters)
      
      return response.success(res, 200, 'Daftar file berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async deleteFile(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Check if user has access to delete this file
      const file = await uploadRepository.getFileById(id, userId)
      if (!file) {
        return response.error(res, 404, 'File tidak ditemukan')
      }

      const deleted = await uploadRepository.deleteFile(id, userId)
      if (!deleted) {
        return response.error(res, 500, 'Gagal menghapus file')
      }

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'file_upload',
        entity_id: id,
        old_values: file,
        description: `File "${file.original_name}" dihapus`
      })

      return response.success(res, 200, 'File berhasil dihapus')
    } catch (error) {
      next(error)
    }
  }

  async getFileStats(req, res, next) {
    try {
      const userId = req.user.id

      const stats = await uploadRepository.getFileStats(userId)
      
      return response.success(res, 200, 'Statistik file berhasil diambil', stats)
    } catch (error) {
      next(error)
    }
  }

  async getFileUsageByProject(req, res, next) {
    try {
      const userId = req.user.id

      const usage = await uploadRepository.getFileUsageByProject(userId)
      
      return response.success(res, 200, 'Penggunaan file per project berhasil diambil', usage)
    } catch (error) {
      next(error)
    }
  }

  async getFileUsageByTask(req, res, next) {
    try {
      const userId = req.user.id

      const usage = await uploadRepository.getFileUsageByTask(userId)
      
      return response.success(res, 200, 'Penggunaan file per task berhasil diambil', usage)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UploadHandler()
