const { pgCore } = require('../config/database')

/**
 * Create activity log entry
 * @param {Object} logData - Activity log data
 * @param {string} logData.user_id - User ID who performed the action
 * @param {string} logData.action - Action performed (created, updated, deleted, etc.)
 * @param {string} logData.entity_type - Type of entity (task, project, comment, etc.)
 * @param {string} logData.entity_id - ID of the entity
 * @param {Object} logData.old_values - Previous values (optional)
 * @param {Object} logData.new_values - New values (optional)
 * @param {string} logData.description - Human readable description (optional)
 */
async function createActivityLog(logData) {
  try {
    const {
      user_id,
      action,
      entity_type,
      entity_id,
      old_values = null,
      new_values = null,
      description = null
    } = logData

    await pgCore('activity_logs').insert({
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      description
    })

    return true
  } catch (error) {
    console.error('Error creating activity log:', error)
    // Don't throw error to avoid breaking main functionality
    return false
  }
}

/**
 * Get activity logs for a specific entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - ID of the entity
 * @param {Object} filters - Additional filters
 * @returns {Array} Array of activity logs
 */
async function getActivityLogs(entityType, entityId, filters = {}) {
  try {
    const { page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    const logs = await pgCore('activity_logs')
      .select([
        'activity_logs.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      ])
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .where({
        'activity_logs.entity_type': entityType,
        'activity_logs.entity_id': entityId
      })
      .orderBy('activity_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const total = await pgCore('activity_logs')
      .where({
        entity_type: entityType,
        entity_id: entityId
      })
      .count('* as count')
      .first()

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  } catch (error) {
    console.error('Error getting activity logs:', error)
    throw error
  }
}

/**
 * Get activity logs for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Additional filters
 * @returns {Array} Array of activity logs
 */
async function getUserActivityLogs(userId, filters = {}) {
  try {
    const { page = 1, limit = 20, entity_type } = filters
    const offset = (page - 1) * limit

    let query = pgCore('activity_logs')
      .select([
        'activity_logs.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      ])
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .where('activity_logs.user_id', userId)

    if (entity_type) {
      query = query.where('activity_logs.entity_type', entity_type)
    }

    const logs = await query
      .orderBy('activity_logs.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    let totalQuery = pgCore('activity_logs').where('user_id', userId)
    if (entity_type) {
      totalQuery = totalQuery.where('entity_type', entity_type)
    }

    const total = await totalQuery.count('* as count').first()

    return {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  } catch (error) {
    console.error('Error getting user activity logs:', error)
    throw error
  }
}

module.exports = {
  createActivityLog,
  getActivityLogs,
  getUserActivityLogs
}
