const express = require('express')
const router = express.Router()

const projectHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { projectValidation } = require('./validation')
const { authenticateToken } = require('../../middlewares/token')

// All routes require authentication
router.use(authenticateToken)

// Project CRUD routes
router.get('/', 
  validateRequest(projectValidation.getProjects), 
  projectHandler.getProjects
)

router.post('/', 
  validateRequest(projectValidation.createProject), 
  projectHandler.createProject
)

router.get('/:id', 
  validateRequest(projectValidation.getProject), 
  projectHandler.getProject
)

router.put('/:id', 
  validateRequest(projectValidation.updateProject), 
  projectHandler.updateProject
)

router.delete('/:id', 
  validateRequest(projectValidation.deleteProject), 
  projectHandler.deleteProject
)

// Project members routes
router.get('/:id/members', 
  validateRequest(projectValidation.getProjectMembers), 
  projectHandler.getProjectMembers
)

router.post('/:id/members', 
  validateRequest(projectValidation.addProjectMember), 
  projectHandler.addProjectMember
)

router.put('/:id/members/:userId', 
  validateRequest(projectValidation.updateProjectMember), 
  projectHandler.updateProjectMember
)

router.delete('/:id/members/:userId', 
  validateRequest(projectValidation.removeProjectMember), 
  projectHandler.removeProjectMember
)

// Project statistics
router.get('/:id/stats', 
  validateRequest(projectValidation.getProjectStats), 
  projectHandler.getProjectStats
)

module.exports = router
