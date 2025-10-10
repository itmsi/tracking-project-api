const { response } = require('../../utils')
const uploadRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')
const { uploadToMinio, isMinioEnabled } = require('../../config/minio')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'temp')
      
      console.log(`📂 Creating upload directory: ${uploadDir}`)
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
        console.log(`✅ Directory created: ${uploadDir}`)
      }
      
      cb(null, uploadDir)
    } catch (error) {
      console.error('❌ Error creating upload directory:', error)
      cb(error)
    }
  },
  filename: function (req, file, cb) {
    try {
      console.log(`📝 Generating filename for: ${file.originalname}`)
      const uniqueFileName = uploadRepository.generateUniqueFileName(file.originalname, req.user.id)
      console.log(`✅ Generated filename: ${uniqueFileName}`)
      cb(null, uniqueFileName)
    } catch (error) {
      console.error('❌ Error generating filename:', error)
      cb(error)
    }
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
  // Middleware for file upload with error handling
  uploadMiddleware() {
    return (req, res, next) => {
      console.log('🔄 Starting file upload middleware')
      
      const uploadHandler = upload.single('file')
      
      uploadHandler(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          console.error('❌ Multer error:', err.code, err.message)
          
          // Handle specific multer errors
          if (err.code === 'LIMIT_FILE_SIZE') {
            return response.error(res, 400, 'File terlalu besar. Maksimal 10MB')
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return response.error(res, 400, 'Terlalu banyak file. Maksimal 5 file')
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return response.error(res, 400, 'Field file tidak sesuai. Gunakan field "file"')
          }
          
          return response.error(res, 400, `Upload error: ${err.message}`)
        } else if (err) {
          console.error('❌ Upload error:', err.message)
          return response.error(res, 400, `Upload error: ${err.message}`)
        }
        
        console.log('✅ File upload middleware completed')
        next()
      })
    }
  }

  async uploadFile(req, res, next) {
    const startTime = Date.now()
    console.log('🚀 Upload started at:', new Date().toISOString())
    
    try {
      const userId = req.user.id
      const { type, description, task_id, project_id } = req.body

      console.log('👤 User ID:', userId)
      console.log('📋 Upload type:', type)
      console.log('📄 Body:', { type, description, task_id, project_id })

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

      // Validate file access based on type (skip for avatar and general)
      if (type === 'task_attachment' && task_id) {
        console.log('🔍 Validating task access for task_id:', task_id)
        const hasAccess = await uploadRepository.validateFileAccess(null, userId, 'task_attachment')
        if (!hasAccess) {
          console.log('❌ Access denied to task')
          // Delete uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
          }
          return response.error(res, 403, 'Tidak memiliki akses ke task ini')
        }
        console.log('✅ Task access validated')
      }

      if (type === 'project_file' && project_id) {
        console.log('🔍 Validating project access for project_id:', project_id)
        const hasAccess = await uploadRepository.validateFileAccess(null, userId, 'project_file')
        if (!hasAccess) {
          console.log('❌ Access denied to project')
          // Delete uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path)
          }
          return response.error(res, 403, 'Tidak memiliki akses ke project ini')
        }
        console.log('✅ Project access validated')
      }

      let fileUrl = req.file.path; // Default to temp path
      let shouldDeleteLocalFile = false;

      // Upload to MinIO if enabled
      if (isMinioEnabled) {
        try {
          console.log('☁️  Uploading file to MinIO...')
          
          // Read file buffer
          const fileBuffer = fs.readFileSync(req.file.path);
          
          // Generate object name (path in MinIO)
          const objectName = `${type}/${req.file.filename}`;
          
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
            // Fallback to local storage
            const permanentDir = path.join(process.cwd(), 'uploads', type)
            if (!fs.existsSync(permanentDir)) {
              fs.mkdirSync(permanentDir, { recursive: true })
            }
            const permanentPath = path.join(permanentDir, req.file.filename)
            fs.renameSync(req.file.path, permanentPath)
            fileUrl = permanentPath;
          }
        } catch (minioError) {
          console.error('❌ Error uploading to MinIO:', minioError.message);
          console.log('⚠️  Falling back to local storage');
          // Fallback to local storage
          const permanentDir = path.join(process.cwd(), 'uploads', type)
          if (!fs.existsSync(permanentDir)) {
            fs.mkdirSync(permanentDir, { recursive: true })
          }
          const permanentPath = path.join(permanentDir, req.file.filename)
          fs.renameSync(req.file.path, permanentPath)
          fileUrl = permanentPath;
        }
      } else {
        console.log('ℹ️  MinIO disabled, using local storage');
        // Move file from temp to permanent location
        const permanentDir = path.join(process.cwd(), 'uploads', type)
        console.log('📂 Creating permanent directory:', permanentDir)
        
        if (!fs.existsSync(permanentDir)) {
          fs.mkdirSync(permanentDir, { recursive: true })
          console.log('✅ Permanent directory created')
        }

        const permanentPath = path.join(permanentDir, req.file.filename)
        console.log('📁 Moving file from:', req.file.path)
        console.log('📁 Moving file to:', permanentPath)
        
        fs.renameSync(req.file.path, permanentPath)
        console.log('✅ File moved successfully')
        fileUrl = permanentPath;
      }

      // Delete temp file if uploaded to MinIO successfully
      if (shouldDeleteLocalFile && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️  Local temp file deleted after MinIO upload');
        } catch (deleteError) {
          console.warn('⚠️  Could not delete temp file:', deleteError.message);
        }
      }

      // Save file record to database
      const fileData = {
        user_id: userId,
        original_name: req.file.originalname,
        file_name: req.file.filename,
        file_path: fileUrl, // Use MinIO URL or local path
        file_size: req.file.size,
        mime_type: req.file.mimetype,
        type,
        description,
        task_id: task_id || null,
        project_id: project_id || null
      }

      console.log('💾 Saving file record to database:', {
        ...fileData,
        storage: isMinioEnabled ? 'MinIO' : 'Local'
      })
      const file = await uploadRepository.createFileRecord(fileData)
      console.log('✅ File record saved with ID:', file.id)

      // Create activity log
      console.log('📝 Creating activity log')
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'file_upload',
        entity_id: file.id,
        new_values: file,
        description: `File "${file.original_name}" diupload`
      })
      console.log('✅ Activity log created')

      const duration = Date.now() - startTime
      console.log(`✅ Upload completed in ${duration}ms`)

      return response.success(res, 201, 'File berhasil diupload', file)
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`❌ Upload failed after ${duration}ms:`, error.message)
      console.error('Error stack:', error.stack)
      
      // Clean up uploaded file if exists
      if (req.file && fs.existsSync(req.file.path)) {
        console.log('🗑️ Cleaning up temp file:', req.file.path)
        try {
          fs.unlinkSync(req.file.path)
          console.log('✅ Temp file cleaned up')
        } catch (cleanupError) {
          console.error('❌ Error cleaning up temp file:', cleanupError.message)
        }
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
