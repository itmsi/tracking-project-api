const express = require('express')
const router = express.Router()

const authHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { authValidation } = require('./validation')
const { authenticateToken } = require('../../middlewares/token')

// Public routes
router.post('/register', 
  validateRequest(authValidation.register), 
  authHandler.register
)

router.post('/login', 
  validateRequest(authValidation.login), 
  authHandler.login
)

router.post('/refresh-token', 
  validateRequest(authValidation.refreshToken), 
  authHandler.refreshToken
)

// Protected routes
router.get('/me', 
  authenticateToken, 
  authHandler.getProfile
)

router.put('/profile', 
  authenticateToken, 
  validateRequest(authValidation.updateProfile), 
  authHandler.updateProfile
)

router.put('/change-password', 
  authenticateToken, 
  validateRequest(authValidation.changePassword), 
  authHandler.changePassword
)

router.post('/logout', 
  authenticateToken, 
  authHandler.logout
)

module.exports = router
