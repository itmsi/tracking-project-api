const { pgCore } = require('../../config/database')

class AnalyticsRepository {
  async getDashboardAnalytics(userId, period = 'month') {
    const dateRange = this.getDateRange(period)
    
    // Get user's projects
    const userProjects = await pgCore('project_members')
      .select('project_id')
      .where({ user_id: userId, is_active: true })

    const projectIds = userProjects.map(p => p.project_id)

    // Projects analytics
    const projectsStats = await pgCore('projects')
      .select([
        pgCore.raw('COUNT(*) as total_projects'),
        pgCore.raw("COUNT(CASE WHEN status = 'active' THEN 1 END) as active_projects"),
        pgCore.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects"),
        pgCore.raw("COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects")
      ])
      .whereIn('id', projectIds)
      .where('is_active', true)
      .first()

    // Tasks analytics
    const tasksStats = await pgCore('tasks')
      .select([
        pgCore.raw('COUNT(*) as total_tasks'),
        pgCore.raw("COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks"),
        pgCore.raw("COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks"),
        pgCore.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks"),
        pgCore.raw("COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks"),
        pgCore.raw("COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks")
      ])
      .whereIn('project_id', projectIds)
      .where('is_active', true)
      .first()

    // Recent activities
    const recentActivities = await pgCore('activity_logs')
      .select([
        'activity_logs.*',
        'users.first_name',
        'users.last_name',
        'users.avatar_url'
      ])
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .whereIn('activity_logs.user_id', await this.getProjectMembers(userId, projectIds))
      .where('activity_logs.created_at', '>=', dateRange.start)
      .orderBy('activity_logs.created_at', 'desc')
      .limit(10)

    return {
      projects: projectsStats,
      tasks: tasksStats,
      recent_activities: recentActivities,
      period,
      date_range: dateRange
    }
  }

  async getProjectAnalytics(userId, projectId = null, period = 'month') {
    const dateRange = this.getDateRange(period)
    
    let whereConditions = {}
    if (projectId) {
      whereConditions.id = projectId
    } else {
      // Get user's projects
      const userProjects = await pgCore('project_members')
        .select('project_id')
        .where({ user_id: userId, is_active: true })
      whereConditions.id = pgCore.raw('IN (?)', [userProjects.map(p => p.project_id)])
    }

    // Project statistics
    const projectStats = await pgCore('projects')
      .select([
        'projects.*',
        pgCore.raw('COUNT(DISTINCT tasks.id) as total_tasks'),
        pgCore.raw("COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END) as completed_tasks"),
        pgCore.raw("COUNT(CASE WHEN tasks.status = 'in_progress' THEN 1 END) as in_progress_tasks"),
        pgCore.raw("COUNT(CASE WHEN tasks.status = 'todo' THEN 1 END) as todo_tasks"),
        pgCore.raw('COUNT(DISTINCT project_members.user_id) as total_members')
      ])
      .leftJoin('tasks', 'projects.id', 'tasks.project_id')
      .leftJoin('project_members', 'projects.id', 'project_members.project_id')
      .where(whereConditions)
      .where('projects.is_active', true)
      .groupBy('projects.id')

    // Task completion over time
    const taskCompletionOverTime = await pgCore('tasks')
      .select([
        pgCore.raw('DATE(updated_at) as date'),
        pgCore.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed")
      ])
      .where(projectId ? { project_id: projectId } : {})
      .where('updated_at', '>=', dateRange.start)
      .where('is_active', true)
      .groupBy(pgCore.raw('DATE(updated_at)'))
      .orderBy('date')

    return {
      projects: projectStats,
      task_completion_over_time: taskCompletionOverTime,
      period,
      date_range: dateRange
    }
  }

  async getTaskAnalytics(userId, projectId = null, period = 'month') {
    const dateRange = this.getDateRange(period)
    
    let whereConditions = { 'tasks.is_active': true }
    if (projectId) {
      whereConditions['tasks.project_id'] = projectId
    } else {
      // Get user's projects
      const userProjects = await pgCore('project_members')
        .select('project_id')
        .where({ user_id: userId, is_active: true })
      whereConditions['tasks.project_id'] = pgCore.raw('IN (?)', [userProjects.map(p => p.project_id)])
    }

    // Task statistics
    const taskStats = await pgCore('tasks')
      .select([
        pgCore.raw('COUNT(*) as total_tasks'),
        pgCore.raw("COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_tasks"),
        pgCore.raw("COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks"),
        pgCore.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks"),
        pgCore.raw("COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_tasks"),
        pgCore.raw("COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority_tasks"),
        pgCore.raw("COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority_tasks"),
        pgCore.raw("COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue_tasks")
      ])
      .where(whereConditions)
      .first()

    // Task creation over time
    const taskCreationOverTime = await pgCore('tasks')
      .select([
        pgCore.raw('DATE(created_at) as date'),
        pgCore.raw('COUNT(*) as created')
      ])
      .where(whereConditions)
      .where('created_at', '>=', dateRange.start)
      .groupBy(pgCore.raw('DATE(created_at)'))
      .orderBy('date')

    // Tasks by assignee
    const tasksByAssignee = await pgCore('tasks')
      .select([
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        pgCore.raw('COUNT(*) as total_tasks'),
        pgCore.raw("COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END) as completed_tasks")
      ])
      .leftJoin('users', 'tasks.assigned_to', 'users.id')
      .where(whereConditions)
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.avatar_url')
      .orderBy(pgCore.raw('COUNT(*)'), 'desc')

    return {
      statistics: taskStats,
      creation_over_time: taskCreationOverTime,
      tasks_by_assignee: tasksByAssignee,
      period,
      date_range: dateRange
    }
  }

  async getTeamAnalytics(userId, teamId = null, period = 'month') {
    const dateRange = this.getDateRange(period)
    
    let whereConditions = { 'teams.is_active': true }
    if (teamId) {
      whereConditions['teams.id'] = teamId
    }

    // Team statistics
    const teamStats = await pgCore('teams')
      .select([
        'teams.*',
        pgCore.raw('COUNT(DISTINCT team_members.user_id) as total_members'),
        pgCore.raw('COUNT(DISTINCT projects.id) as total_projects')
      ])
      .leftJoin('team_members', 'teams.id', 'team_members.team_id')
      .leftJoin('projects', 'teams.id', 'projects.team_id')
      .where(whereConditions)
      .groupBy('teams.id')

    // Team performance
    const teamPerformance = await pgCore('tasks')
      .select([
        'users.first_name',
        'users.last_name',
        'users.avatar_url',
        'teams.name as team_name',
        pgCore.raw('COUNT(tasks.id) as total_tasks'),
        pgCore.raw("COUNT(CASE WHEN tasks.status = 'completed' THEN 1 END) as completed_tasks"),
        pgCore.raw('ROUND(AVG(CASE WHEN tasks.status = \'completed\' THEN EXTRACT(EPOCH FROM (tasks.updated_at - tasks.created_at))/3600 ELSE NULL END), 2) as avg_completion_hours')
      ])
      .leftJoin('users', 'tasks.assigned_to', 'users.id')
      .leftJoin('team_members', 'users.id', 'team_members.user_id')
      .leftJoin('teams', 'team_members.team_id', 'teams.id')
      .where(whereConditions)
      .where('tasks.is_active', true)
      .groupBy('users.id', 'users.first_name', 'users.last_name', 'users.avatar_url', 'teams.name')
      .orderBy(pgCore.raw('COUNT(tasks.id)'), 'desc')

    return {
      teams: teamStats,
      team_performance: teamPerformance,
      period,
      date_range: dateRange
    }
  }

  getDateRange(period) {
    const now = new Date()
    let start

    switch (period) {
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return {
      start,
      end: now,
      period
    }
  }

  async getProjectMembers(userId, projectIds) {
    const members = await pgCore('project_members')
      .select('user_id')
      .whereIn('project_id', projectIds)
      .where('is_active', true)
    
    return members.map(m => m.user_id)
  }
}

module.exports = new AnalyticsRepository()
