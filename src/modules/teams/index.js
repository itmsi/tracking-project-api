const express = require('express')
const router = express.Router()

const teamHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { teamValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Team CRUD routes
router.get('/', 
  validateRequest(teamValidation.getTeams), 
  teamHandler.getTeams
)

router.post('/', 
  validateRequest(teamValidation.createTeam), 
  teamHandler.createTeam
)

router.get('/:id', 
  validateRequest(teamValidation.getTeam), 
  teamHandler.getTeam
)

router.put('/:id', 
  validateRequest(teamValidation.updateTeam), 
  teamHandler.updateTeam
)

router.delete('/:id', 
  validateRequest(teamValidation.deleteTeam), 
  teamHandler.deleteTeam
)

// Team members routes
router.get('/:id/members', 
  validateRequest(teamValidation.getTeamMembers), 
  teamHandler.getTeamMembers
)

router.post('/:id/members', 
  validateRequest(teamValidation.addTeamMember), 
  teamHandler.addTeamMember
)

router.put('/:id/members/:userId', 
  validateRequest(teamValidation.updateTeamMember), 
  teamHandler.updateTeamMember
)

router.delete('/:id/members/:userId', 
  validateRequest(teamValidation.removeTeamMember), 
  teamHandler.removeTeamMember
)

module.exports = router
