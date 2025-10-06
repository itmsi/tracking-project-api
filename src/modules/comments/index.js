const express = require('express')
const router = express.Router()

const commentHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { commentValidation } = require('./validation')
const { authenticateToken } = require('../../middlewares/token')

// All routes require authentication
router.use(authenticateToken)

// Comment CRUD routes
router.get('/task/:taskId', 
  validateRequest(commentValidation.getComments), 
  commentHandler.getComments
)

router.post('/task/:taskId', 
  validateRequest(commentValidation.createComment), 
  commentHandler.createComment
)

router.put('/:id', 
  validateRequest(commentValidation.updateComment), 
  commentHandler.updateComment
)

router.delete('/:id', 
  validateRequest(commentValidation.deleteComment), 
  commentHandler.deleteComment
)

module.exports = router
