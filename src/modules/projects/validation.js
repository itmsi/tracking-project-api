const Joi = require('joi')

const projectValidation = {
  getProjects: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      search: Joi.string().optional(),
      status: Joi.string().valid('active', 'on_hold', 'completed', 'cancelled').optional(),
      team_id: Joi.string().uuid().optional()
    })
  },

  createProject: {
    body: Joi.object({
      name: Joi.string().min(3).max(100).required().messages({
        'string.min': 'Nama project minimal 3 karakter',
        'string.max': 'Nama project maksimal 100 karakter',
        'any.required': 'Nama project harus diisi'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi maksimal 1000 karakter'
      }),
      team_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Team ID tidak valid'
      }),
      start_date: Joi.date().optional(),
      end_date: Joi.date().min(Joi.ref('start_date')).optional().messages({
        'date.min': 'Tanggal selesai harus setelah tanggal mulai'
      }),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6').messages({
        'string.pattern.base': 'Color harus dalam format hex (#RRGGBB)'
      })
    })
  },

  getProject: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    })
  },

  updateProject: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    }),
    body: Joi.object({
      name: Joi.string().min(3).max(100).optional().messages({
        'string.min': 'Nama project minimal 3 karakter',
        'string.max': 'Nama project maksimal 100 karakter'
      }),
      description: Joi.string().max(1000).optional().messages({
        'string.max': 'Deskripsi maksimal 1000 karakter'
      }),
      status: Joi.string().valid('active', 'on_hold', 'completed', 'cancelled').optional(),
      start_date: Joi.date().optional(),
      end_date: Joi.date().min(Joi.ref('start_date')).optional().messages({
        'date.min': 'Tanggal selesai harus setelah tanggal mulai'
      }),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional().messages({
        'string.pattern.base': 'Color harus dalam format hex (#RRGGBB)'
      })
    })
  },

  deleteProject: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    })
  },

  getProjectMembers: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    })
  },

  addProjectMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    }),
    body: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      }),
      role: Joi.string().valid('owner', 'admin', 'member', 'viewer').default('member').messages({
        'any.only': 'Role harus salah satu dari: owner, admin, member, viewer'
      })
    })
  },

  updateProjectMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      }),
      userId: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    }),
    body: Joi.object({
      role: Joi.string().valid('owner', 'admin', 'member', 'viewer').required().messages({
        'any.only': 'Role harus salah satu dari: owner, admin, member, viewer',
        'any.required': 'Role harus diisi'
      })
    })
  },

  removeProjectMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      }),
      userId: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      })
    })
  },

  getProjectStats: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      })
    })
  }
}

module.exports = { projectValidation }
