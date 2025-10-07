const Joi = require('joi')

const commentValidation = {
  getComments: {
    query: Joi.object({
      task_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Task ID tidak valid'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    }).custom((value, helpers) => {
      // At least one of task_id or project_id must be provided
      if (!value.task_id && !value.project_id) {
        return helpers.error('custom.required');
      }
      return value;
    }).messages({
      'custom.required': 'Task ID atau Project ID harus diisi'
    })
  },

  createComment: {
    body: Joi.object({
      content: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Komentar tidak boleh kosong',
        'string.max': 'Komentar maksimal 2000 karakter',
        'any.required': 'Komentar harus diisi'
      }),
      task_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Task ID tidak valid'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      parent_comment_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Parent comment ID tidak valid'
      }),
      attachments: Joi.array().items(
        Joi.object({
          filename: Joi.string().required(),
          url: Joi.string().uri().required(),
          size: Joi.number().integer().min(0).optional(),
          mime_type: Joi.string().optional()
        })
      ).optional()
    }).custom((value, helpers) => {
      // At least one of task_id or project_id must be provided
      if (!value.task_id && !value.project_id) {
        return helpers.error('custom.required');
      }
      return value;
    }).messages({
      'custom.required': 'Task ID atau Project ID harus diisi'
    })
  },

  updateComment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Comment ID tidak valid',
        'any.required': 'Comment ID harus diisi'
      })
    }),
    body: Joi.object({
      content: Joi.string().min(1).max(2000).required().messages({
        'string.min': 'Komentar tidak boleh kosong',
        'string.max': 'Komentar maksimal 2000 karakter',
        'any.required': 'Komentar harus diisi'
      })
    })
  },

  deleteComment: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'Comment ID tidak valid',
        'any.required': 'Comment ID harus diisi'
      })
    })
  }
}

module.exports = { commentValidation }
