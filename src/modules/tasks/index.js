const express = require('express')
const router = express.Router()

const taskHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { taskValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Task CRUD routes
router.get('/', 
  validateRequest(taskValidation.getTasks), 
  taskHandler.getTasks
)

router.post('/', 
  validateRequest(taskValidation.createTask), 
  taskHandler.createTask
)

router.get('/:id', 
  validateRequest(taskValidation.getTask), 
  taskHandler.getTask
)

router.put('/:id', 
  validateRequest(taskValidation.updateTask), 
  taskHandler.updateTask
)

router.delete('/:id', 
  validateRequest(taskValidation.deleteTask), 
  taskHandler.deleteTask
)

// Task status update (for kanban board)
router.patch('/:id/status', 
  validateRequest(taskValidation.updateTaskStatus), 
  taskHandler.updateTaskStatus
)

// Task assignment
router.patch('/:id/assign', 
  validateRequest(taskValidation.assignTask), 
  taskHandler.assignTask
)

// Task position update (for kanban board ordering)
router.patch('/:id/position', 
  validateRequest(taskValidation.updateTaskPosition), 
  taskHandler.updateTaskPosition
)

// Subtasks
router.get('/:id/subtasks', 
  validateRequest(taskValidation.getSubtasks), 
  taskHandler.getSubtasks
)

router.post('/:id/subtasks', 
  validateRequest(taskValidation.createSubtask), 
  taskHandler.createSubtask
)

// Task attachments
router.post('/:id/attachments', 
  validateRequest(taskValidation.addAttachment), 
  taskHandler.addAttachment
)

router.delete('/:id/attachments/:attachmentId', 
  validateRequest(taskValidation.removeAttachment), 
  taskHandler.removeAttachment
)

module.exports = router
