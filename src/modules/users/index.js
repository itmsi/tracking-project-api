const express = require('express')
const router = express.Router()

const userHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { userValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// User management routes (admin only)
router.get('/', 
  validateRequest(userValidation.getUsers), 
  userHandler.getUsers
)

router.get('/:id', 
  validateRequest(userValidation.getUser), 
  userHandler.getUser
)

router.put('/:id', 
  validateRequest(userValidation.updateUser), 
  userHandler.updateUser
)

router.delete('/:id', 
  validateRequest(userValidation.deleteUser), 
  userHandler.deleteUser
)

// User activity logs
router.get('/:id/activity', 
  validateRequest(userValidation.getUserActivity), 
  userHandler.getUserActivity
)

module.exports = router
