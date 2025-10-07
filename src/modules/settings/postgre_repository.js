const { pgCore } = require('../../config/database')

class SettingsRepository {
  async getUserSettings(userId) {
    const settings = await pgCore('user_settings')
      .where({ user_id: userId })
      .first()

    if (!settings) {
      // Create default settings if not exist
      const defaultSettings = {
        user_id: userId,
        theme: 'light',
        language: 'id',
        timezone: 'Asia/Jakarta',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        notifications: {
          email: true,
          push: true,
          task_assigned: true,
          task_completed: false,
          task_due_soon: true,
          project_updated: true,
          comment_added: true,
          meeting_reminder: true
        },
        dashboard: {
          default_view: 'kanban',
          items_per_page: 20,
          show_completed_tasks: false
        },
        privacy: {
          show_online_status: true,
          allow_mentions: true,
          profile_visibility: 'team'
        }
      }

      const [newSettings] = await pgCore('user_settings')
        .insert(defaultSettings)
        .returning('*')

      return newSettings
    }

    return settings
  }

  async updateUserSettings(userId, updateData) {
    // Check if settings exist
    const existingSettings = await pgCore('user_settings')
      .where({ user_id: userId })
      .first()

    let result

    if (existingSettings) {
      // Update existing settings
      const [settings] = await pgCore('user_settings')
        .where({ user_id: userId })
        .update({
          ...updateData,
          updated_at: new Date()
        })
        .returning('*')
      
      result = settings
    } else {
      // Create new settings
      const [settings] = await pgCore('user_settings')
        .insert({
          user_id: userId,
          ...updateData
        })
        .returning('*')
      
      result = settings
    }

    return result
  }

  async getSystemSettings() {
    const settings = await pgCore('system_settings')
      .where({ is_active: true })
      .select('key', 'value', 'type')

    // Convert to object format
    const settingsObj = {}
    settings.forEach(setting => {
      let value = setting.value
      
      // Parse value based on type
      switch (setting.type) {
        case 'boolean':
          value = value === 'true'
          break
        case 'number':
          value = parseFloat(value)
          break
        case 'json':
          value = JSON.parse(value)
          break
        default:
          // Keep as string
          break
      }
      
      settingsObj[setting.key] = value
    })

    return settingsObj
  }

  async updateSystemSetting(key, value, userId) {
    // Only admin can update system settings
    const user = await pgCore('users')
      .where({ id: userId, role: 'admin' })
      .first()

    if (!user) {
      throw new Error('Hanya admin yang dapat mengubah system settings')
    }

    const settingType = typeof value
    const stringValue = settingType === 'object' ? JSON.stringify(value) : String(value)

    const result = await pgCore('system_settings')
      .where({ key })
      .update({
        value: stringValue,
        type: settingType,
        updated_by: userId,
        updated_at: new Date()
      })

    return result > 0
  }

  async getUserPreferences(userId) {
    const settings = await this.getUserSettings(userId)
    
    return {
      theme: settings.theme,
      language: settings.language,
      timezone: settings.timezone,
      date_format: settings.date_format,
      time_format: settings.time_format
    }
  }

  async getNotificationPreferences(userId) {
    const settings = await this.getUserSettings(userId)
    
    return settings.notifications || {}
  }

  async getDashboardPreferences(userId) {
    const settings = await this.getUserSettings(userId)
    
    return settings.dashboard || {}
  }

  async getPrivacyPreferences(userId) {
    const settings = await this.getUserSettings(userId)
    
    return settings.privacy || {}
  }
}

module.exports = new SettingsRepository()
