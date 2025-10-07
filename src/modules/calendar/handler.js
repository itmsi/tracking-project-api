const { response } = require('../../utils')
const calendarRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class CalendarHandler {
  async getEvents(req, res, next) {
    try {
      const userId = req.user.id
      const { start_date, end_date, project_id, user_id } = req.query

      const filters = {
        start_date,
        end_date,
        project_id,
        user_id: user_id || userId // Default to current user if not specified
      }

      const events = await calendarRepository.getEvents(userId, filters)
      
      return response.success(res, 200, 'Daftar event berhasil diambil', events)
    } catch (error) {
      next(error)
    }
  }

  async createEvent(req, res, next) {
    try {
      const userId = req.user.id
      const eventData = {
        ...req.body,
        creator_id: userId,
        attendees: req.body.attendees || []
      }

      const event = await calendarRepository.createEvent(eventData)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'calendar_event',
        entity_id: event.id,
        new_values: event,
        description: `Event "${event.title}" dibuat`
      })

      return response.success(res, 201, 'Event berhasil dibuat', event)
    } catch (error) {
      next(error)
    }
  }

  async updateEvent(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      // Get old event data for activity log
      const oldEvent = await calendarRepository.getEventById(id, userId)
      if (!oldEvent) {
        return response.error(res, 404, 'Event tidak ditemukan')
      }

      const event = await calendarRepository.updateEvent(id, updateData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'calendar_event',
        entity_id: id,
        old_values: oldEvent,
        new_values: event,
        description: `Event "${event.title}" diperbarui`
      })

      return response.success(res, 200, 'Event berhasil diperbarui', event)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Get event data for activity log
      const event = await calendarRepository.getEventById(id, userId)
      if (!event) {
        return response.error(res, 404, 'Event tidak ditemukan')
      }

      const deleted = await calendarRepository.deleteEvent(id, userId)
      if (!deleted) {
        return response.error(res, 500, 'Gagal menghapus event')
      }

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'calendar_event',
        entity_id: id,
        old_values: event,
        description: `Event "${event.title}" dihapus`
      })

      return response.success(res, 200, 'Event berhasil dihapus')
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async getUpcomingEvents(req, res, next) {
    try {
      const userId = req.user.id
      const { limit = 5 } = req.query

      const events = await calendarRepository.getUpcomingEvents(userId, parseInt(limit))
      
      return response.success(res, 200, 'Event mendatang berhasil diambil', events)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new CalendarHandler()
