const jwt = require('jsonwebtoken')
const { response } = require('../../utils')
const authRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

class AuthHandler {
  async register(req, res, next) {
    try {
      const { email, password, first_name, last_name, role } = req.body

      // Check if email already exists
      const emailExists = await authRepository.checkEmailExists(email)
      if (emailExists) {
        return response.error(res, 400, 'Email sudah terdaftar')
      }

      // Create user
      const user = await authRepository.createUser({
        email,
        password,
        first_name,
        last_name,
        role
      })

      // Create activity log
      await createActivityLog({
        user_id: user.id,
        action: 'created',
        entity_type: 'user',
        entity_id: user.id,
        description: `User ${user.first_name} ${user.last_name} mendaftar`
      })

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      const refreshToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email 
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      )

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        access_token: accessToken,
        refresh_token: refreshToken
      }

      return response.success(res, 201, 'Registrasi berhasil', userData)
    } catch (error) {
      next(error)
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body

      // Find user by email
      const user = await authRepository.findUserByEmail(email)
      if (!user) {
        return response.error(res, 401, 'Email atau password salah')
      }

      // Verify password
      const isPasswordValid = await authRepository.verifyPassword(password, user.password)
      if (!isPasswordValid) {
        return response.error(res, 401, 'Email atau password salah')
      }

      // Update last login
      await authRepository.updateLastLogin(user.id)

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      const refreshToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email 
        },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
      )

      // Create activity log
      await createActivityLog({
        user_id: user.id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id,
        description: `User ${user.first_name} ${user.last_name} login`
      })

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        access_token: accessToken,
        refresh_token: refreshToken
      }

      return response.success(res, 200, 'Login berhasil', userData)
    } catch (error) {
      next(error)
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body

      // Verify refresh token
      const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET)
      
      // Find user
      const user = await authRepository.findUserById(decoded.id)
      if (!user) {
        return response.error(res, 401, 'Token tidak valid')
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      )

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        access_token: accessToken
      }

      return response.success(res, 200, 'Token berhasil diperbarui', userData)
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return response.error(res, 401, 'Token tidak valid')
      }
      next(error)
    }
  }

  async getProfile(req, res, next) {
    try {
      const userId = req.user.id

      const user = await authRepository.findUserById(userId)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        last_login: user.last_login,
        created_at: user.created_at
      }

      return response.success(res, 200, 'Profile berhasil diambil', userData)
    } catch (error) {
      next(error)
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id
      const { first_name, last_name, avatar_url } = req.body

      const updateData = {}
      if (first_name) updateData.first_name = first_name
      if (last_name) updateData.last_name = last_name
      if (avatar_url) updateData.avatar_url = avatar_url

      const user = await authRepository.updateUser(userId, updateData)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'user',
        entity_id: userId,
        description: `User ${user.first_name} ${user.last_name} memperbarui profile`
      })

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        updated_at: user.updated_at
      }

      return response.success(res, 200, 'Profile berhasil diperbarui', userData)
    } catch (error) {
      next(error)
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id
      const { current_password, new_password } = req.body

      // Get current user
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      // Verify current password
      const isCurrentPasswordValid = await authRepository.verifyPassword(current_password, user.password)
      if (!isCurrentPasswordValid) {
        return response.error(res, 400, 'Password saat ini salah')
      }

      // Update password
      await authRepository.updatePassword(userId, new_password)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'user',
        entity_id: userId,
        description: `User ${user.first_name} ${user.last_name} mengubah password`
      })

      return response.success(res, 200, 'Password berhasil diubah')
    } catch (error) {
      next(error)
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user.id

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'logout',
        entity_type: 'user',
        entity_id: userId,
        description: 'User logout'
      })

      return response.success(res, 200, 'Logout berhasil')
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AuthHandler()
