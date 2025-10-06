const Joi = require('joi')

const taskValidation = {
  getTasks: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      project_id: Joi.string().uuid().optional(),
      status: Joi.string().valid('todo', 'in_progress', 'done', 'blocked').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      assigned_to: Joi.string().uuid().optional(),
      search: Joi.string().optional(),
      due_date_from: Joi.date().optional(),
      due_date_to: Joi.date().optional()
    })
  },

  createTask: {
    body: Joi.object({
      title: Joi.string().min(3).max(200).required().messages({
        'string.min': 'Judul task minimal 3 karakter',
        'string.max': 'Judul task maksimal 200 karakter',
        'any.required': 'Judul task harus diisi'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': 'Deskripsi maksimal 2000 karakter'
      }),
      project_id: Joi.string().uuid().required().messages({
        'string.uuid': 'Project ID tidak valid',
        'any.required': 'Project ID harus diisi'
      }),
      assigned_to: Joi.string().uuid().optional().messages({
        'string.uuid': 'Assigned user ID tidak valid'
      }),
      status: Joi.string().valid('todo', 'in_progress', 'done', 'blocked').default('todo'),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      due_date: Joi.date().optional(),
      parent_task_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Parent task ID tidak valid'
      }),
      checklist: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          completed: Joi.boolean().default(false)
        })
      ).optional()
    })
  },

  getTask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    })
  },

  updateTask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200).optional().messages({
        'string.min': 'Judul task minimal 3 karakter',
        'string.max': 'Judul task maksimal 200 karakter'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': 'Deskripsi maksimal 2000 karakter'
      }),
      assigned_to: Joi.string().uuid().optional().messages({
        'string.uuid': 'Assigned user ID tidak valid'
      }),
      status: Joi.string().valid('todo', 'in_progress', 'done', 'blocked').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      due_date: Joi.date().optional(),
      checklist: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          text: Joi.string().required(),
          completed: Joi.boolean().default(false)
        })
      ).optional()
    })
  },

  deleteTask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    })
  },

  updateTaskStatus: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      status: Joi.string().valid('todo', 'in_progress', 'done', 'blocked').required().messages({
        'any.required': 'Status harus diisi'
      }),
      position: Joi.number().integer().min(0).optional()
    })
  },

  assignTask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      assigned_to: Joi.string().uuid().allow(null).optional().messages({
        'string.uuid': 'Assigned user ID tidak valid'
      })
    })
  },

  updateTaskPosition: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      position: Joi.number().integer().min(0).required().messages({
        'any.required': 'Position harus diisi'
      })
    })
  },

  getSubtasks: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    })
  },

  createSubtask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Parent task ID tidak valid',
        'any.required': 'Parent task ID harus diisi'
      })
    }),
    body: Joi.object({
      title: Joi.string().min(3).max(200).required().messages({
        'string.min': 'Judul subtask minimal 3 karakter',
        'string.max': 'Judul subtask maksimal 200 karakter',
        'any.required': 'Judul subtask harus diisi'
      }),
      description: Joi.string().max(2000).optional().messages({
        'string.max': 'Deskripsi maksimal 2000 karakter'
      }),
      assigned_to: Joi.string().uuid().optional().messages({
        'string.uuid': 'Assigned user ID tidak valid'
      }),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
      due_date: Joi.date().optional()
    })
  },

  addAttachment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      filename: Joi.string().required().messages({
        'any.required': 'Filename harus diisi'
      }),
      url: Joi.string().uri().required().messages({
        'string.uri': 'URL tidak valid',
        'any.required': 'URL harus diisi'
      }),
      size: Joi.number().integer().min(0).optional(),
      mime_type: Joi.string().optional()
    })
  },

  removeAttachment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      attachmentId: Joi.string().required().messages({
        'any.required': 'Attachment ID harus diisi'
      })
    })
  }
}

module.exports = { taskValidation }
