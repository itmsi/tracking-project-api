const express = require('express')
const router = express.Router()

const analyticsHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { analyticsValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Analytics routes
router.get('/dashboard', 
  validateRequest(analyticsValidation.getDashboard), 
  analyticsHandler.getDashboardAnalytics
)

router.get('/projects', 
  validateRequest(analyticsValidation.getProjects), 
  analyticsHandler.getProjectAnalytics
)

router.get('/tasks', 
  validateRequest(analyticsValidation.getTasks), 
  analyticsHandler.getTaskAnalytics
)

router.get('/teams', 
  validateRequest(analyticsValidation.getTeams), 
  analyticsHandler.getTeamAnalytics
)

module.exports = router
