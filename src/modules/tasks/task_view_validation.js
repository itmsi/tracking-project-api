const Joi = require('joi')

const taskViewValidation = {
  // Task View
  getTaskView: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    })
  },

  // Task Details
  getTaskDetails: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    })
  },

  createTaskDetails: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      description: Joi.string().optional().messages({
        'string.base': 'Description harus berupa string'
      }),
      requirements: Joi.string().optional().messages({
        'string.base': 'Requirements harus berupa string'
      }),
      acceptance_criteria: Joi.string().optional().messages({
        'string.base': 'Acceptance criteria harus berupa string'
      }),
      metadata: Joi.object().optional().messages({
        'object.base': 'Metadata harus berupa object'
      })
    })
  },

  updateTaskDetails: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      description: Joi.string().optional().messages({
        'string.base': 'Description harus berupa string'
      }),
      requirements: Joi.string().optional().messages({
        'string.base': 'Requirements harus berupa string'
      }),
      acceptance_criteria: Joi.string().optional().messages({
        'string.base': 'Acceptance criteria harus berupa string'
      }),
      metadata: Joi.object().optional().messages({
        'object.base': 'Metadata harus berupa object'
      })
    })
  },

  // Task Chat
  getTaskChat: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(50).messages({
        'number.base': 'Limit harus berupa angka',
        'number.integer': 'Limit harus berupa bilangan bulat',
        'number.min': 'Limit minimal 1',
        'number.max': 'Limit maksimal 100'
      }),
      offset: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Offset harus berupa angka',
        'number.integer': 'Offset harus berupa bilangan bulat',
        'number.min': 'Offset minimal 0'
      })
    })
  },

  createChatMessage: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      message: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Message minimal 1 karakter',
        'string.max': 'Message maksimal 2000 karakter',
        'any.required': 'Message harus diisi'
      }),
      attachments: Joi.array().optional().messages({
        'array.base': 'Attachments harus berupa array'
      }),
      reply_to: Joi.string().uuid().optional().messages({
        'string.uuid': 'Reply to ID tidak valid'
      })
    })
  },

  updateChatMessage: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      messageId: Joi.string().uuid().required().messages({
        'string.uuid': 'Message ID tidak valid',
        'any.required': 'Message ID harus diisi'
      })
    }),
    body: Joi.object({
      message: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Message minimal 1 karakter',
        'string.max': 'Message maksimal 2000 karakter',
        'any.required': 'Message harus diisi'
      })
    })
  },

  deleteChatMessage: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      messageId: Joi.string().uuid().required().messages({
        'string.uuid': 'Message ID tidak valid',
        'any.required': 'Message ID harus diisi'
      })
    })
  },

  // Task Attachments
  getTaskAttachments: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    query: Joi.object({
      file_type: Joi.string().valid('image', 'document', 'video', 'audio', 'other').optional().messages({
        'any.only': 'File type harus image, document, video, audio, atau other'
      }),
      limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'Limit harus berupa angka',
        'number.integer': 'Limit harus berupa bilangan bulat',
        'number.min': 'Limit minimal 1',
        'number.max': 'Limit maksimal 100'
      }),
      offset: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Offset harus berupa angka',
        'number.integer': 'Offset harus berupa bilangan bulat',
        'number.min': 'Offset minimal 0'
      })
    })
  },

  uploadAttachment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      file_type: Joi.string().valid('image', 'document', 'video', 'audio', 'other').default('document').messages({
        'any.only': 'File type harus image, document, video, audio, atau other'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Description maksimal 500 karakter'
      }),
      is_public: Joi.boolean().default(true).messages({
        'boolean.base': 'Is public harus berupa boolean'
      })
    })
  },

  deleteAttachment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      attachmentId: Joi.string().uuid().required().messages({
        'string.uuid': 'Attachment ID tidak valid',
        'any.required': 'Attachment ID harus diisi'
      })
    })
  },

  // Task Members
  getTaskMembers: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    query: Joi.object({
      role: Joi.string().valid('owner', 'admin', 'member', 'viewer').optional().messages({
        'any.only': 'Role harus owner, admin, member, atau viewer'
      }),
      limit: Joi.number().integer().min(1).max(100).default(50).messages({
        'number.base': 'Limit harus berupa angka',
        'number.integer': 'Limit harus berupa bilangan bulat',
        'number.min': 'Limit minimal 1',
        'number.max': 'Limit maksimal 100'
      }),
      offset: Joi.number().integer().min(0).default(0).messages({
        'number.base': 'Offset harus berupa angka',
        'number.integer': 'Offset harus berupa bilangan bulat',
        'number.min': 'Offset minimal 0'
      })
    })
  },

  addTaskMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    body: Joi.object({
      user_id: Joi.string().uuid().required().messages({
        'string.uuid': 'User ID tidak valid',
        'any.required': 'User ID harus diisi'
      }),
      role: Joi.string().valid('admin', 'member', 'viewer').default('member').messages({
        'any.only': 'Role harus admin, member, atau viewer'
      }),
      can_edit: Joi.boolean().default(true).messages({
        'boolean.base': 'Can edit harus berupa boolean'
      }),
      can_comment: Joi.boolean().default(true).messages({
        'boolean.base': 'Can comment harus berupa boolean'
      }),
      can_upload: Joi.boolean().default(true).messages({
        'boolean.base': 'Can upload harus berupa boolean'
      })
    })
  },

  updateTaskMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      memberId: Joi.string().uuid().required().messages({
        'string.uuid': 'Member ID tidak valid',
        'any.required': 'Member ID harus diisi'
      })
    }),
    body: Joi.object({
      role: Joi.string().valid('admin', 'member', 'viewer').optional().messages({
        'any.only': 'Role harus admin, member, atau viewer'
      }),
      can_edit: Joi.boolean().optional().messages({
        'boolean.base': 'Can edit harus berupa boolean'
      }),
      can_comment: Joi.boolean().optional().messages({
        'boolean.base': 'Can comment harus berupa boolean'
      }),
      can_upload: Joi.boolean().optional().messages({
        'boolean.base': 'Can upload harus berupa boolean'
      })
    })
  },

  removeTaskMember: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      }),
      memberId: Joi.string().uuid().required().messages({
        'string.uuid': 'Member ID tidak valid',
        'any.required': 'Member ID harus diisi'
      })
    })
  },

  searchUsersForTask: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Task ID tidak valid',
        'any.required': 'Task ID harus diisi'
      })
    }),
    query: Joi.object({
      q: Joi.string().min(2).max(100).required().messages({
        'string.min': 'Search term minimal 2 karakter',
        'string.max': 'Search term maksimal 100 karakter',
        'any.required': 'Search term harus diisi'
      }),
      limit: Joi.number().integer().min(1).max(50).default(10).messages({
        'number.base': 'Limit harus berupa angka',
        'number.integer': 'Limit harus berupa bilangan bulat',
        'number.min': 'Limit minimal 1',
        'number.max': 'Limit maksimal 50'
      })
    })
  }
}

module.exports = { taskViewValidation }
