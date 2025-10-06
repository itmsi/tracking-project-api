const Joi = require('joi')

const userValidation = {
  getUsers: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().optional(),
      role: Joi.string().valid('admin', 'project_manager', 'developer', 'user').optional()
    })
  },

  getUser: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    })
  },

  updateUser: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    }),
    body: Joi.object({
      first_name: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Nama depan minimal 2 karakter',
        'string.max': 'Nama depan maksimal 50 karakter'
      }),
      last_name: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Nama belakang minimal 2 karakter',
        'string.max': 'Nama belakang maksimal 50 karakter'
      }),
      role: Joi.string().valid('admin', 'project_manager', 'developer', 'user').optional().messages({
        'any.only': 'Role harus salah satu dari: admin, project_manager, developer, user'
      }),
      avatar_url: Joi.string().uri().optional().messages({
        'string.uri': 'URL avatar tidak valid'
      }),
      is_active: Joi.boolean().optional()
    })
  },

  deleteUser: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    })
  },

  getUserActivity: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    }),
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      entity_type: Joi.string().optional()
    })
  }
}

module.exports = { userValidation }
