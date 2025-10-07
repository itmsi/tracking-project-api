const Joi = require('joi')

const uploadValidation = {
  uploadFile: {
    body: Joi.object({
      type: Joi.string().valid('avatar', 'task_attachment', 'project_file', 'general').required().messages({
        'any.only': 'Type harus salah satu dari: avatar, task_attachment, project_file, general',
        'any.required': 'Type harus diisi'
      }),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Deskripsi maksimal 500 karakter'
      }),
      task_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Task ID tidak valid'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      })
    }).custom((value, helpers) => {
      // If type is task_attachment, task_id must be provided
      if (value.type === 'task_attachment' && !value.task_id) {
        return helpers.error('custom.taskRequired');
      }
      
      // If type is project_file, project_id must be provided
      if (value.type === 'project_file' && !value.project_id) {
        return helpers.error('custom.projectRequired');
      }
      
      return value;
    }).messages({
      'custom.taskRequired': 'Task ID harus diisi untuk task_attachment',
      'custom.projectRequired': 'Project ID harus diisi untuk project_file'
    })
  },

  deleteFile: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.uuid': 'File ID tidak valid',
        'any.required': 'File ID harus diisi'
      })
    })
  },

  getFiles: {
    query: Joi.object({
      type: Joi.string().valid('avatar', 'task_attachment', 'project_file', 'general').optional().messages({
        'any.only': 'Type harus salah satu dari: avatar, task_attachment, project_file, general'
      }),
      task_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Task ID tidak valid'
      }),
      project_id: Joi.string().uuid().optional().messages({
        'string.uuid': 'Project ID tidak valid'
      }),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    })
  }
}

module.exports = { uploadValidation }
