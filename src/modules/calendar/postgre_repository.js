const { pgCore } = require('../../config/database')

class CalendarRepository {
  async createEvent(eventData) {
    const [event] = await pgCore('calendar_events')
      .insert(eventData)
      .returning('*')
    
    return event
  }

  async getEvents(userId, filters = {}) {
    const { start_date, end_date, project_id, user_id } = filters

    let whereConditions = {
      is_active: true
    }

    // Date range filter
    if (start_date && end_date) {
      whereConditions = {
        ...whereConditions,
        start_date: pgCore.raw('>= ?', [start_date]),
        end_date: pgCore.raw('<= ?', [end_date])
      }
    }

    // Project filter
    if (project_id) {
      whereConditions.project_id = project_id
    }

    // User filter (for events where user is attendee or creator)
    if (user_id) {
      whereConditions = pgCore.raw('(creator_id = ? OR ? = ANY(attendees))', [user_id, user_id])
    }

    const events = await pgCore('calendar_events')
      .select([
        'calendar_events.*',
        'projects.name as project_name',
        'projects.color as project_color',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.avatar_url as creator_avatar_url'
      ])
      .leftJoin('projects', 'calendar_events.project_id', 'projects.id')
      .leftJoin('users as creator', 'calendar_events.creator_id', 'creator.id')
      .where(whereConditions)
      .orderBy('calendar_events.start_date', 'asc')

    return events
  }

  async getEventById(id, userId) {
    const event = await pgCore('calendar_events')
      .select([
        'calendar_events.*',
        'projects.name as project_name',
        'projects.color as project_color',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.avatar_url as creator_avatar_url'
      ])
      .leftJoin('projects', 'calendar_events.project_id', 'projects.id')
      .leftJoin('users as creator', 'calendar_events.creator_id', 'creator.id')
      .where({
        'calendar_events.id': id,
        'calendar_events.is_active': true
      })
      .where(function() {
        this.where('calendar_events.creator_id', userId)
          .orWhere(pgCore.raw('? = ANY(calendar_events.attendees)', [userId]))
      })
      .first()

    return event
  }

  async updateEvent(id, updateData, userId) {
    // Check if user has permission to update
    const hasPermission = await this.checkUserPermission(id, userId)
    if (!hasPermission) {
      throw new Error('Tidak memiliki akses untuk mengubah event ini')
    }

    const [event] = await pgCore('calendar_events')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return event
  }

  async deleteEvent(id, userId) {
    // Check if user has permission to delete
    const hasPermission = await this.checkUserPermission(id, userId)
    if (!hasPermission) {
      throw new Error('Tidak memiliki akses untuk menghapus event ini')
    }

    // Soft delete
    const result = await pgCore('calendar_events')
      .where({ id })
      .update({ is_active: false })
    
    return result > 0
  }

  async checkUserPermission(eventId, userId) {
    // Check if user is event creator
    const event = await pgCore('calendar_events')
      .where({ id: eventId, creator_id: userId })
      .first()
    
    if (event) return true

    // Check if user is project member with appropriate role
    const projectMember = await pgCore('calendar_events')
      .select('project_members.*')
      .leftJoin('projects', 'calendar_events.project_id', 'projects.id')
      .leftJoin('project_members', 'projects.id', 'project_members.project_id')
      .where('calendar_events.id', eventId)
      .where('project_members.user_id', userId)
      .where('project_members.is_active', true)
      .whereIn('project_members.role', ['owner', 'admin'])
      .first()
    
    if (projectMember) return true

    return false
  }

  async getUpcomingEvents(userId, limit = 5) {
    const events = await pgCore('calendar_events')
      .select([
        'calendar_events.*',
        'projects.name as project_name',
        'projects.color as project_color'
      ])
      .leftJoin('projects', 'calendar_events.project_id', 'projects.id')
      .where({
        'calendar_events.is_active': true,
        start_date: pgCore.raw('>= NOW()')
      })
      .where(function() {
        this.where('calendar_events.creator_id', userId)
          .orWhere(pgCore.raw('? = ANY(calendar_events.attendees)', [userId]))
      })
      .orderBy('calendar_events.start_date', 'asc')
      .limit(limit)

    return events
  }

  async getEventsByProject(projectId, startDate, endDate) {
    const events = await pgCore('calendar_events')
      .select([
        'calendar_events.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.avatar_url as creator_avatar_url'
      ])
      .leftJoin('users as creator', 'calendar_events.creator_id', 'creator.id')
      .where({
        'calendar_events.project_id': projectId,
        'calendar_events.is_active': true
      })
      .where('calendar_events.start_date', '>=', startDate)
      .where('calendar_events.end_date', '<=', endDate)
      .orderBy('calendar_events.start_date', 'asc')

    return events
  }
}

module.exports = new CalendarRepository()
