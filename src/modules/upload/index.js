const express = require('express')
const router = express.Router()

const UploadHandler = require('./handler')
const uploadHandler = UploadHandler
const { validateRequest } = require('../../middlewares/validation')
const { uploadValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Upload routes
router.post('/', 
  UploadHandler.uploadMiddleware(),
  validateRequest(uploadValidation.uploadFile), 
  uploadHandler.uploadFile
)

router.get('/', 
  validateRequest(uploadValidation.getFiles), 
  uploadHandler.getFiles
)

router.delete('/:id', 
  validateRequest(uploadValidation.deleteFile), 
  uploadHandler.deleteFile
)

// File statistics routes
router.get('/stats', 
  uploadHandler.getFileStats
)

router.get('/usage/projects', 
  uploadHandler.getFileUsageByProject
)

router.get('/usage/tasks', 
  uploadHandler.getFileUsageByTask
)

module.exports = router
