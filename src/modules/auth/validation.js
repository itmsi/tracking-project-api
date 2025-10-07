const Joi = require('joi')

const authValidation = {
  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Email tidak valid',
        'any.required': 'Email harus diisi'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'Password minimal 6 karakter',
        'any.required': 'Password harus diisi'
      })
    })
  },
  register: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Email tidak valid',
        'any.required': 'Email harus diisi'
      }),
      password: Joi.string().min(6).required().messages({
        'string.min': 'Password minimal 6 karakter',
        'any.required': 'Password harus diisi'
      }),
      first_name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Nama depan minimal 2 karakter',
        'string.max': 'Nama depan maksimal 50 karakter',
        'any.required': 'Nama depan harus diisi'
      }),
      last_name: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Nama belakang minimal 2 karakter',
        'string.max': 'Nama belakang maksimal 50 karakter',
        'any.required': 'Nama belakang harus diisi'
      }),
      role: Joi.string().valid('admin', 'project_manager', 'developer', 'user').optional().default('user').messages({
        'any.only': 'Role harus salah satu dari: admin, project_manager, developer, user'
      })
    })
  },
  updateProfile: {
    body: Joi.object({
      first_name: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Nama depan minimal 2 karakter',
        'string.max': 'Nama depan maksimal 50 karakter'
      }),
      last_name: Joi.string().min(2).max(50).optional().messages({
        'string.min': 'Nama belakang minimal 2 karakter',
        'string.max': 'Nama belakang maksimal 50 karakter'
      }),
      avatar_url: Joi.string().uri().optional().messages({
        'string.uri': 'URL avatar tidak valid'
      })
    })
  },
  changePassword: {
    body: Joi.object({
      current_password: Joi.string().required().messages({
        'any.required': 'Password lama harus diisi'
      }),
      new_password: Joi.string().min(6).required().messages({
        'string.min': 'Password baru minimal 6 karakter',
        'any.required': 'Password baru harus diisi'
      }),
      confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
        'any.only': 'Konfirmasi password tidak sama dengan password baru',
        'any.required': 'Konfirmasi password harus diisi'
      })
    })
  },
  refreshToken: {
    body: Joi.object({
      refresh_token: Joi.string().required().messages({
        'any.required': 'Refresh token harus diisi'
      })
    })
  }
}

module.exports = { authValidation }
