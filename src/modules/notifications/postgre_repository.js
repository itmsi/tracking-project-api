const { pgCore } = require('../../config/database')

class NotificationRepository {
  async createNotification(notificationData) {
    const [notification] = await pgCore('notifications')
      .insert(notificationData)
      .returning('*')
    
    return notification
  }

  async getNotifications(userId, filters = {}) {
    const { page = 1, limit = 10, unread_only } = filters
    const offset = (page - 1) * limit

    let whereConditions = { 
      'notifications.user_id': userId,
      'notifications.is_active': true
    }

    if (unread_only) {
      whereConditions['notifications.is_read'] = false
    }

    const notifications = await pgCore('notifications')
      .select([
        'notifications.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name'
      ])
      .leftJoin('users', 'notifications.sender_id', 'users.id')
      .where(whereConditions)
      .orderBy('notifications.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const total = await pgCore('notifications')
      .where({
        user_id: userId,
        is_active: true
      })
      .count('* as count')
      .first()

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getNotificationById(id, userId) {
    const notification = await pgCore('notifications')
      .select([
        'notifications.*',
        'users.first_name as sender_first_name',
        'users.last_name as sender_last_name',
        'users.avatar_url as sender_avatar_url'
      ])
      .leftJoin('users', 'notifications.sender_id', 'users.id')
      .where({
        'notifications.id': id,
        'notifications.user_id': userId,
        'notifications.is_active': true
      })
      .first()

    return notification
  }

  async markAsRead(id, userId) {
    const [notification] = await pgCore('notifications')
      .where({
        id,
        user_id: userId
      })
      .update({
        is_read: true,
        read_at: new Date()
      })
      .returning('*')
    
    return notification
  }

  async markAllAsRead(userId) {
    const result = await pgCore('notifications')
      .where({
        user_id: userId,
        is_read: false
      })
      .update({
        is_read: true,
        read_at: new Date()
      })
    
    return result
  }

  async deleteNotification(id, userId) {
    // Soft delete
    const result = await pgCore('notifications')
      .where({
        id,
        user_id: userId
      })
      .update({
        is_active: false
      })
    
    return result > 0
  }

  async getUnreadCount(userId) {
    const result = await pgCore('notifications')
      .where({
        user_id: userId,
        is_read: false,
        is_active: true
      })
      .count('* as count')
      .first()

    return parseInt(result.count)
  }

  async createBulkNotifications(notificationsData) {
    const notifications = await pgCore('notifications')
      .insert(notificationsData)
      .returning('*')
    
    return notifications
  }
}

module.exports = new NotificationRepository()
