const express = require('express')
const router = express.Router()

const calendarHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { calendarValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// All routes require authentication
router.use(verifyToken)

// Calendar routes
router.get('/events', 
  validateRequest(calendarValidation.getEvents), 
  calendarHandler.getEvents
)

router.post('/events', 
  validateRequest(calendarValidation.createEvent), 
  calendarHandler.createEvent
)

router.put('/events/:id', 
  validateRequest(calendarValidation.updateEvent), 
  calendarHandler.updateEvent
)

router.delete('/events/:id', 
  validateRequest(calendarValidation.deleteEvent), 
  calendarHandler.deleteEvent
)

// Additional calendar routes
router.get('/events/upcoming', 
  calendarHandler.getUpcomingEvents
)

module.exports = router
