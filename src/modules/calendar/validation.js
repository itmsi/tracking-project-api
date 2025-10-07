const Joi = require('joi')

const calendarValidation = {
  getEvents: {
    query: Joi.object({
      start_date: Joi.date().iso().required().messages({
        'date.format': 'Start date harus dalam format ISO (YYYY-MM-DD)',
        'any.required': 'Start date harus diisi'
      }),
      end_date: Joi.date().iso().required().messages({
        'date.format': 'End date harus dalam format ISO (YYYY-MM-DD)',
        'any.required': 'End date harus diisi'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      user_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'User ID tidak valid'
      })
    })
  },

  createEvent: {
    body: Joi.object({
      title: Joi.string().min(1).max(200).required().messages({
        'string.min': 'Judul event tidak boleh kosong',
        'string.max': 'Judul event maksimal 200 karakter',
        'any.required': 'Judul event harus diisi'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi event maksimal 1000 karakter'
      }),
      start_date: Joi.date().iso().required().messages({
        'date.format': 'Start date harus dalam format ISO',
        'any.required': 'Start date harus diisi'
      }),
      end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
        'date.format': 'End date harus dalam format ISO',
        'date.min': 'End date harus lebih besar dari start date',
        'any.required': 'End date harus diisi'
      }),
      type: Joi.string().valid('meeting', 'deadline', 'milestone', 'other').default('meeting').messages({
        'any.only': 'Type harus salah satu dari: meeting, deadline, milestone, other'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      attendees: Joi.array().items(
        Joi.string().uuid()
      ).optional()
    })
  },

  updateEvent: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Event ID tidak valid',
        'any.required': 'Event ID harus diisi'
      })
    }),
    body: Joi.object({
      title: Joi.string().min(1).max(200).optional().messages({
        'string.min': 'Judul event tidak boleh kosong',
        'string.max': 'Judul event maksimal 200 karakter'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi event maksimal 1000 karakter'
      }),
      start_date: Joi.date().iso().optional().messages({
        'date.format': 'Start date harus dalam format ISO'
      }),
      end_date: Joi.date().iso().optional().messages({
        'date.format': 'End date harus dalam format ISO'
      }),
      type: Joi.string().valid('meeting', 'deadline', 'milestone', 'other').optional().messages({
        'any.only': 'Type harus salah satu dari: meeting, deadline, milestone, other'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      attendees: Joi.array().items(
        Joi.string().uuid()
      ).optional()
    }).custom((value, helpers) => {
      // If both start_date and end_date are provided, validate end_date > start_date
      if (value.start_date && value.end_date) {
        if (new Date(value.end_date) <= new Date(value.start_date)) {
          return helpers.error('custom.dateRange');
        }
      }
      return value;
    }).messages({
      'custom.dateRange': 'End date harus lebih besar dari start date'
    })
  },

  deleteEvent: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Event ID tidak valid',
        'any.required': 'Event ID harus diisi'
      })
    })
  }
}

module.exports = { calendarValidation }
