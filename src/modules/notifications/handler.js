const { response } = require('../../utils')
const notificationRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class NotificationHandler {
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.id
      const filters = req.query

      const result = await notificationRepository.getNotifications(userId, filters)
      
      return response.success(res, 200, 'Daftar notifikasi berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const notification = await notificationRepository.markAsRead(id, userId)
      if (!notification) {
        return response.error(res, 404, 'Notifikasi tidak ditemukan')
      }

      return response.success(res, 200, 'Notifikasi berhasil ditandai sebagai dibaca', notification)
    } catch (error) {
      next(error)
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id

      const result = await notificationRepository.markAllAsRead(userId)

      return response.success(res, 200, `${result} notifikasi berhasil ditandai sebagai dibaca`)
    } catch (error) {
      next(error)
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const deleted = await notificationRepository.deleteNotification(id, userId)
      if (!deleted) {
        return response.error(res, 404, 'Notifikasi tidak ditemukan')
      }

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'notification',
        entity_id: id,
        description: `Notifikasi dihapus`
      })

      return response.success(res, 200, 'Notifikasi berhasil dihapus')
    } catch (error) {
      next(error)
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id

      const count = await notificationRepository.getUnreadCount(userId)

      return response.success(res, 200, 'Jumlah notifikasi belum dibaca', { unread_count: count })
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new NotificationHandler()
