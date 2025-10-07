const express = require('express')
const router = express.Router()

const settingsHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { settingsValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Settings routes
router.get('/', 
  settingsHandler.getUserSettings
)

router.put('/', 
  validateRequest(settingsValidation.updateSettings), 
  settingsHandler.updateUserSettings
)

// System settings (admin only)
router.get('/system', 
  settingsHandler.getSystemSettings
)

router.put('/system', 
  settingsHandler.updateSystemSetting
)

// Preference routes
router.get('/preferences', 
  settingsHandler.getUserPreferences
)

router.get('/notifications', 
  settingsHandler.getNotificationPreferences
)

router.get('/dashboard', 
  settingsHandler.getDashboardPreferences
)

router.get('/privacy', 
  settingsHandler.getPrivacyPreferences
)

module.exports = router
