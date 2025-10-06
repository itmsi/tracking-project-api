const express = require('express')
const router = express.Router()

const authHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { authValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// Public routes - tidak memerlukan authentication
router.post('/login', 
  validateRequest(authValidation.login), 
  authHandler.login
)

router.post('/register', 
  validateRequest(authValidation.register), 
  authHandler.register
)

// Protected routes - memerlukan authentication
router.get('/me', 
  verifyToken, 
  authHandler.getProfile
)

router.put('/profile', 
  verifyToken, 
  validateRequest(authValidation.updateProfile), 
  authHandler.updateProfile
)

module.exports = router
