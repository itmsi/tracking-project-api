const Joi = require('joi')

const teamValidation = {
  getTeams: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().optional()
    })
  },

  createTeam: {
    body: Joi.object({
      name: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nama team minimal 3 karakter',
        'string.max': 'Nama team maksimal 100 karakter',
        'any.required': 'Nama team harus diisi'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi maksimal 1000 karakter'
      })
    })
  },

  getTeam: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      })
    })
  },

  updateTeam: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      })
    }),
    body: Joi.object({
      name: Joi.string().min(3).max(100).optional().messages({
        'string.min': 'Nama team minimal 3 karakter',
        'string.max': 'Nama team maksimal 100 karakter'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi maksimal 1000 karakter'
      })
    })
  },

  deleteTeam: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      })
    })
  },

  getTeamMembers: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      })
    })
  },

  addTeamMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      })
    }),
    body: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      }),
      role: Joi.string().valid('owner', 'admin', 'member').default('member').messages({
        'any.only': 'Role harus salah satu dari: owner, admin, member'
      })
    })
  },

  updateTeamMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      }),
      userId: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    }),
    body: Joi.object({
      role: Joi.string().valid('owner', 'admin', 'member').required().messages({
        'any.only': 'Role harus salah satu dari: owner, admin, member',
        'any.required': 'Role harus diisi'
      })
    })
  },

  removeTeamMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Team ID tidak valid',
        'any.required': 'Team ID harus diisi'
      }),
      userId: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    })
  }
}

module.exports = { teamValidation }
