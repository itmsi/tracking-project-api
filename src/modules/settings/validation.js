const Joi = require('joi')

const settingsValidation = {
  updateSettings: {
    body: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional().messages({
        'any.only': 'Theme harus salah satu dari: light, dark, auto'
      }),
      language: Joi.string().valid('id', 'en').optional().messages({
        'any.only': 'Language harus salah satu dari: id, en'
      }),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        task_assigned: Joi.boolean().optional(),
        task_completed: Joi.boolean().optional(),
        task_due_soon: Joi.boolean().optional(),
        project_updated: Joi.boolean().optional(),
        comment_added: Joi.boolean().optional(),
        meeting_reminder: Joi.boolean().optional()
      }).optional(),
      timezone: Joi.string().optional().messages({
        'string.base': 'Timezone harus berupa string'
      }),
      date_format: Joi.string().valid('DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD').optional().messages({
        'any.only': 'Date format harus salah satu dari: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD'
      }),
      time_format: Joi.string().valid('12h', '24h').optional().messages({
        'any.only': 'Time format harus salah satu dari: 12h, 24h'
      }),
      dashboard: Joi.object({
        default_view: Joi.string().valid('kanban', 'list', 'calendar').optional().messages({
          'any.only': 'Default view harus salah satu dari: kanban, list, calendar'
        }),
        items_per_page: Joi.number().integer().min(5).max(100).optional().messages({
          'number.min': 'Items per page minimal 5',
          'number.max': 'Items per page maksimal 100'
        }),
        show_completed_tasks: Joi.boolean().optional()
      }).optional(),
      privacy: Joi.object({
        show_online_status: Joi.boolean().optional(),
        allow_mentions: Joi.boolean().optional(),
        profile_visibility: Joi.string().valid('public', 'team', 'private').optional().messages({
          'any.only': 'Profile visibility harus salah satu dari: public, team, private'
        })
      }).optional()
    })
  }
}

module.exports = { settingsValidation }
