const { response } = require('../../utils')
const settingsRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')
const { pgCore } = require('../../config/database')

class SettingsHandler {
  async getUserSettings(req, res, next) {
    try {
      const userId = req.user.id

      const settings = await settingsRepository.getUserSettings(userId)
      
      return response.success(res, 200, 'Pengaturan user berhasil diambil', settings)
    } catch (error) {
      next(error)
    }
  }

  async updateUserSettings(req, res, next) {
    try {
      const userId = req.user.id
      const updateData = req.body

      // Get old settings for activity log
      const oldSettings = await settingsRepository.getUserSettings(userId)

      const settings = await settingsRepository.updateUserSettings(userId, updateData)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'user_settings',
        entity_id: userId,
        old_values: oldSettings,
        new_values: settings,
        description: `Pengaturan user diperbarui`
      })

      return response.success(res, 200, 'Pengaturan berhasil diperbarui', settings)
    } catch (error) {
      next(error)
    }
  }

  async getSystemSettings(req, res, next) {
    try {
      const userId = req.user.id

      // Only admin can access system settings
      const user = await pgCore('users')
        .where({ id: userId, role: 'admin' })
        .first()

      if (!user) {
        return response.error(res, 403, 'Hanya admin yang dapat mengakses system settings')
      }

      const settings = await settingsRepository.getSystemSettings()
      
      return response.success(res, 200, 'System settings berhasil diambil', settings)
    } catch (error) {
      next(error)
    }
  }

  async updateSystemSetting(req, res, next) {
    try {
      const userId = req.user.id
      const { key, value } = req.body

      const result = await settingsRepository.updateSystemSetting(key, value, userId)
      
      if (!result) {
        return response.error(res, 404, 'System setting tidak ditemukan')
      }

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'system_setting',
        entity_id: key,
        new_values: { key, value },
        description: `System setting ${key} diperbarui`
      })

      return response.success(res, 200, 'System setting berhasil diperbarui')
    } catch (error) {
      if (error.message.includes('Hanya admin')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async getUserPreferences(req, res, next) {
    try {
      const userId = req.user.id

      const preferences = await settingsRepository.getUserPreferences(userId)
      
      return response.success(res, 200, 'User preferences berhasil diambil', preferences)
    } catch (error) {
      next(error)
    }
  }

  async getNotificationPreferences(req, res, next) {
    try {
      const userId = req.user.id

      const preferences = await settingsRepository.getNotificationPreferences(userId)
      
      return response.success(res, 200, 'Notification preferences berhasil diambil', preferences)
    } catch (error) {
      next(error)
    }
  }

  async getDashboardPreferences(req, res, next) {
    try {
      const userId = req.user.id

      const preferences = await settingsRepository.getDashboardPreferences(userId)
      
      return response.success(res, 200, 'Dashboard preferences berhasil diambil', preferences)
    } catch (error) {
      next(error)
    }
  }

  async getPrivacyPreferences(req, res, next) {
    try {
      const userId = req.user.id

      const preferences = await settingsRepository.getPrivacyPreferences(userId)
      
      return response.success(res, 200, 'Privacy preferences berhasil diambil', preferences)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new SettingsHandler()
