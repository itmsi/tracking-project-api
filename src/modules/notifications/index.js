const express = require('express')
const router = express.Router()

const notificationHandler = require('./handler')
const { validateRequest } = require('../../middlewares/validation')
const { notificationValidation } = require('./validation')
const { verifyToken } = require('../../middlewares/token')

// Test endpoint without authentication
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notifications API is working',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint with mock data (no auth required)
router.get('/test-unread-count', (req, res) => {
  res.json({
    success: true,
    message: 'Jumlah notifikasi belum dibaca',
    data: {
      unread_count: 5
    },
    timestamp: new Date().toISOString()
  });
});

// All routes require authentication
router.use(verifyToken)

// Notification routes
// IMPORTANT: Specific routes must come BEFORE parameterized routes

router.get('/unread-count', 
  notificationHandler.getUnreadCount
)

router.patch('/read-all', 
  notificationHandler.markAllAsRead
)

router.get('/', 
  validateRequest(notificationValidation.getNotifications), 
  notificationHandler.getNotifications
)

router.patch('/:id/read', 
  validateRequest(notificationValidation.markAsRead), 
  notificationHandler.markAsRead
)

router.delete('/:id', 
  validateRequest(notificationValidation.deleteNotification), 
  notificationHandler.deleteNotification
)

module.exports = router
