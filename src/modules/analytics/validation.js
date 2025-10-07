const Joi = require('joi')

const analyticsValidation = {
  getDashboard: {
    query: Joi.object({
      period: Joi.string().valid('week', 'month', 'year').default('month').messages({
        'any.only': 'Period harus salah satu dari: week, month, year'
      })
    })
  },

  getProjects: {
    query: Joi.object({
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      period: Joi.string().valid('week', 'month', 'year').default('month').messages({
        'any.only': 'Period harus salah satu dari: week, month, year'
      })
    })
  },

  getTasks: {
    query: Joi.object({
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      period: Joi.string().valid('week', 'month', 'year').default('month').messages({
        'any.only': 'Period harus salah satu dari: week, month, year'
      })
    })
  },

  getTeams: {
    query: Joi.object({
      team_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Team ID tidak valid'
      }),
      period: Joi.string().valid('week', 'month', 'year').default('month').messages({
        'any.only': 'Period harus salah satu dari: week, month, year'
      })
    })
  }
}

module.exports = { analyticsValidation }
