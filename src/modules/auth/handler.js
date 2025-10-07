const { response } = require('../../utils')
const authRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')
const jwt = require('jsonwebtoken')

class AuthHandler {

  async login(req, res, next) {
    try {
      const { email, password } = req.body

      // Verify user credentials
      const user = await authRepository.verifyPassword(email, password)
      if (!user) {
        return response.error(res, 401, 'Email atau password salah')
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          roles: [user.role] // For compatibility with existing middleware
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      )

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        avatar_url: user.avatar_url,
        last_login: user.last_login,
        access_token: token
      }

      return response.success(res, 200, 'Login berhasil', userData)
    } catch (error) {
      next(error)
    }
  }

  async register(req, res, next) {
    try {
      const { email, password, first_name, last_name, role } = req.body

      // Check if user already exists
      const existingUser = await authRepository.findUserByEmail(email)
      if (existingUser) {
        return response.error(res, 400, 'Email sudah terdaftar')
      }

      // Create new user
      const user = await authRepository.createUser({
        email,
        password,
        first_name,
        last_name,
        role
      })

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          roles: [user.role] // For compatibility with existing middleware
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      )

      // Create activity log
      await createActivityLog({
        user_id: user.id,
        action: 'created',
        entity_type: 'user',
        entity_id: user.id,
        description: `User baru ${user.first_name} ${user.last_name} terdaftar`
      })

      const userData = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
        access_token: token
      }

      return response.success(res, 201, 'Registrasi berhasil', userData)
    } catch (error) {
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

      // Verify current password
      const user = await authRepository.findUserById(userId)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      const isCurrentPasswordValid = await authRepository.verifyPassword(user.email, current_password)
      if (!isCurrentPasswordValid) {
        return response.error(res, 400, 'Password lama salah')
      }

      // Update password
      const updatedUser = await authRepository.updatePassword(userId, new_password)
      if (!updatedUser) {
        return response.error(res, 500, 'Gagal mengubah password')
      }

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
        description: `User logout`
      })

      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success
      return response.success(res, 200, 'Logout berhasil')
    } catch (error) {
      next(error)
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refresh_token } = req.body

      // In a real implementation, you would:
      // 1. Verify the refresh token
      // 2. Generate a new access token
      // 3. Optionally generate a new refresh token
      
      // For now, we'll return an error since we don't have refresh token implementation
      return response.error(res, 501, 'Refresh token belum diimplementasikan')
    } catch (error) {
      next(error)
    }
  }

}

module.exports = new AuthHandler()
