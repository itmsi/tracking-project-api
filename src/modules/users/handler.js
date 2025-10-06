const { response } = require('../../utils')
const userRepository = require('./postgre_repository')
const { getUserActivityLogs } = require('../../utils/activity_logger')
const { createActivityLog } = require('../../utils/activity_logger')

class UserHandler {
  async getUsers(req, res, next) {
    try {
      const currentUser = req.user
      
      // Check if user is admin
      if (currentUser.role !== 'admin') {
        return response.error(res, 403, 'Hanya admin yang dapat mengakses daftar user')
      }

      const filters = req.query
      const result = await userRepository.getUsers(filters)
      
      return response.success(res, 200, 'Daftar user berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async getUser(req, res, next) {
    try {
      const currentUser = req.user
      const { id } = req.params

      // Check if user is admin or viewing their own profile
      if (currentUser.role !== 'admin' && currentUser.id !== id) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat user ini')
      }

      const user = await userRepository.getUserById(id)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      return response.success(res, 200, 'User berhasil diambil', user)
    } catch (error) {
      next(error)
    }
  }

  async updateUser(req, res, next) {
    try {
      const currentUser = req.user
      const { id } = req.params
      const updateData = req.body

      // Check if user is admin or updating their own profile
      if (currentUser.role !== 'admin' && currentUser.id !== id) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah user ini')
      }

      // Non-admin users cannot change role or is_active
      if (currentUser.role !== 'admin') {
        delete updateData.role
        delete updateData.is_active
      }

      // Get old user data for activity log
      const oldUser = await userRepository.getUserById(id)
      if (!oldUser) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      const user = await userRepository.updateUser(id, updateData)

      // Create activity log
      await createActivityLog({
        user_id: currentUser.id,
        action: 'updated',
        entity_type: 'user',
        entity_id: id,
        old_values: oldUser,
        new_values: user,
        description: `User ${user.first_name} ${user.last_name} diperbarui`
      })

      return response.success(res, 200, 'User berhasil diperbarui', user)
    } catch (error) {
      next(error)
    }
  }

  async deleteUser(req, res, next) {
    try {
      const currentUser = req.user
      const { id } = req.params

      // Check if user is admin
      if (currentUser.role !== 'admin') {
        return response.error(res, 403, 'Hanya admin yang dapat menghapus user')
      }

      // Cannot delete own account
      if (currentUser.id === id) {
        return response.error(res, 400, 'Tidak dapat menghapus akun sendiri')
      }

      // Get user data for activity log
      const user = await userRepository.getUserById(id)
      if (!user) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      await userRepository.deleteUser(id)

      // Create activity log
      await createActivityLog({
        user_id: currentUser.id,
        action: 'deleted',
        entity_type: 'user',
        entity_id: id,
        old_values: user,
        description: `User ${user.first_name} ${user.last_name} dihapus`
      })

      return response.success(res, 200, 'User berhasil dihapus')
    } catch (error) {
      next(error)
    }
  }

  async getUserActivity(req, res, next) {
    try {
      const currentUser = req.user
      const { id } = req.params
      const filters = req.query

      // Check if user is admin or viewing their own activity
      if (currentUser.role !== 'admin' && currentUser.id !== id) {
        return response.error(res, 403, 'Tidak memiliki akses untuk melihat aktivitas user ini')
      }

      // Check if user exists
      const userExists = await userRepository.checkUserExists(id)
      if (!userExists) {
        return response.error(res, 404, 'User tidak ditemukan')
      }

      const result = await getUserActivityLogs(id, filters)
      
      return response.success(res, 200, 'Aktivitas user berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new UserHandler()
