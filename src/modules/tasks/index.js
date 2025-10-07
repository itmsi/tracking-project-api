const express = require('express')
const router = express.Router()

const taskHandler = require('./handler')
const taskViewHandler = require('./task_view_handler')
const { validateRequest } = require('../../middlewares/validation')
const { taskValidation } = require('./validation')
const { taskViewValidation } = require('./task_view_validation')
const { verifyToken } = require('../../middlewares/token')
const { uploadMiddleware } = require('../../middlewares/fileUpload')

// All routes require authentication
router.use(verifyToken)

// Task CRUD routes
router.get('/', 
  validateRequest(taskValidation.getTasks), 
  taskHandler.getTasks
)

router.post('/', 
  (req, res, next) => {
    // Clean up assigned_to field - convert empty string to null
    if (req.body.assigned_to === '') {
      req.body.assigned_to = null;
    }
    next();
  },
  validateRequest(taskValidation.createTask), 
  taskHandler.createTask
)

// ===== NEW TASK VIEW FEATURES (Must be before /:id route) =====

// Task View - Complete task view with all details
router.get('/:id/view', 
  validateRequest(taskViewValidation.getTaskView), 
  taskViewHandler.getTaskView
)

// Task Details Management
router.get('/:id/details', 
  validateRequest(taskViewValidation.getTaskDetails), 
  taskViewHandler.getTaskDetails
)

router.post('/:id/details', 
  validateRequest(taskViewValidation.createTaskDetails), 
  taskViewHandler.createTaskDetails
)

router.put('/:id/details', 
  validateRequest(taskViewValidation.updateTaskDetails), 
  taskViewHandler.updateTaskDetails
)

// Task Chat Management
router.get('/:id/chat', 
  validateRequest(taskViewValidation.getTaskChat), 
  taskViewHandler.getTaskChat
)

router.post('/:id/chat', 
  validateRequest(taskViewValidation.createChatMessage), 
  taskViewHandler.createChatMessage
)

router.put('/:id/chat/:messageId', 
  validateRequest(taskViewValidation.updateChatMessage), 
  taskViewHandler.updateChatMessage
)

router.delete('/:id/chat/:messageId', 
  validateRequest(taskViewValidation.deleteChatMessage), 
  taskViewHandler.deleteChatMessage
)

// Task Attachments Management (New)
router.get('/:id/attachments', 
  validateRequest(taskViewValidation.getTaskAttachments), 
  taskViewHandler.getTaskAttachments
)

router.post('/:id/attachments/upload', 
  uploadMiddleware('task_attachments'), 
  validateRequest(taskViewValidation.uploadAttachment), 
  taskViewHandler.uploadAttachment
)

router.delete('/:id/attachments/:attachmentId', 
  validateRequest(taskViewValidation.deleteAttachment), 
  taskViewHandler.deleteAttachment
)

// Task Members Management
router.get('/:id/members', 
  validateRequest(taskViewValidation.getTaskMembers), 
  taskViewHandler.getTaskMembers
)

router.post('/:id/members', 
  validateRequest(taskViewValidation.addTaskMember), 
  taskViewHandler.addTaskMember
)

router.put('/:id/members/:memberId', 
  validateRequest(taskViewValidation.updateTaskMember), 
  taskViewHandler.updateTaskMember
)

router.delete('/:id/members/:memberId', 
  validateRequest(taskViewValidation.removeTaskMember), 
  taskViewHandler.removeTaskMember
)

// Search users for task
router.get('/:id/members/search', 
  validateRequest(taskViewValidation.searchUsersForTask), 
  taskViewHandler.searchUsersForTask
)

// Basic task routes
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
