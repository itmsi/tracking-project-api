const Joi = require('joi')

const notificationValidation = {
  getNotifications: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      unread_only: Joi.boolean().optional()
    })
  },

  markAsRead: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Notification ID tidak valid',
        'any.required': 'Notification ID harus diisi'
      })
    })
  },

  deleteNotification: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Notification ID tidak valid',
        'any.required': 'Notification ID harus diisi'
      })
    })
  }
}

module.exports = { notificationValidation }
