const { pgCore } = require('../../config/database')

class ProjectRepository {
  async createProject(projectData) {
    const [project] = await pgCore('projects')
      .insert(projectData)
      .returning('*')
    
    return project
  }

  async getProjects(filters = {}) {
    const { page = 1, limit = 10, search, status, team_id, user_id } = filters
    const offset = (page - 1) * limit

    let query = pgCore('projects')
      .select([
        'projects.*',
        'teams.name as team_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name'
      ])
      .leftJoin('teams', 'projects.team_id', 'teams.id')
      .leftJoin('users as creator', 'projects.created_by', 'creator.id')
      .where('projects.is_active', true)

    // Filter by user access (user must be member of project or team)
    if (user_id) {
      query = query.where(function() {
        this.where('projects.created_by', user_id)
          .orWhereExists(function() {
            this.select('*')
              .from('project_members')
              .whereRaw('project_members.project_id = projects.id')
              .where('project_members.user_id', user_id)
              .where('project_members.is_active', true)
          })
          .orWhereExists(function() {
            this.select('*')
              .from('team_members')
              .whereRaw('team_members.team_id = projects.team_id')
              .where('team_members.user_id', user_id)
              .where('team_members.is_active', true)
          })
      })
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('projects.name', `%${search}%`)
          .orWhereILike('projects.description', `%${search}%`)
      })
    }

    if (status) {
      query = query.where('projects.status', status)
    }

    if (team_id) {
      query = query.where('projects.team_id', team_id)
    }

    const projects = await query
      .orderBy('projects.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    // Get total count
    let countQuery = pgCore('projects').where('is_active', true)
    
    if (user_id) {
      countQuery = countQuery.where(function() {
        this.where('created_by', user_id)
          .orWhereExists(function() {
            this.select('*')
              .from('project_members')
              .whereRaw('project_members.project_id = projects.id')
              .where('project_members.user_id', user_id)
              .where('project_members.is_active', true)
          })
          .orWhereExists(function() {
            this.select('*')
              .from('team_members')
              .whereRaw('team_members.team_id = projects.team_id')
              .where('team_members.user_id', user_id)
              .where('team_members.is_active', true)
          })
      })
    }

    if (search) {
      countQuery = countQuery.where(function() {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
      })
    }

    if (status) {
      countQuery = countQuery.where('status', status)
    }

    if (team_id) {
      countQuery = countQuery.where('team_id', team_id)
    }

    const total = await countQuery.count('* as count').first()

    return {
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getProjectById(id, userId = null) {
    let query = pgCore('projects')
      .select([
        'projects.*',
        'teams.name as team_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.email as creator_email'
      ])
      .leftJoin('teams', 'projects.team_id', 'teams.id')
      .leftJoin('users as creator', 'projects.created_by', 'creator.id')
      .where('projects.id', id)
      .where('projects.is_active', true)

    // Check user access
    if (userId) {
      query = query.where(function() {
        this.where('projects.created_by', userId)
          .orWhereExists(function() {
            this.select('*')
              .from('project_members')
              .whereRaw('project_members.project_id = projects.id')
              .where('project_members.user_id', userId)
              .where('project_members.is_active', true)
          })
          .orWhereExists(function() {
            this.select('*')
              .from('team_members')
              .whereRaw('team_members.team_id = projects.team_id')
              .where('team_members.user_id', userId)
              .where('team_members.is_active', true)
          })
      })
    }

    const project = await query.first()
    return project
  }

  async updateProject(id, updateData, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah project ini')
      }
    }

    const [project] = await pgCore('projects')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return project
  }

  async deleteProject(id, userId = null) {
    // Check if user has permission to delete
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId, ['owner'])
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menghapus project ini')
      }
    }

    // Soft delete
    await pgCore('projects')
      .where({ id })
      .update({ is_active: false })
    
    return true
  }

  async getProjectMembers(projectId) {
    const members = await pgCore('project_members')
      .select([
        'project_members.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.avatar_url'
      ])
      .leftJoin('users', 'project_members.user_id', 'users.id')
      .where('project_members.project_id', projectId)
      .where('project_members.is_active', true)
      .orderBy('project_members.created_at', 'asc')
    
    return members
  }

  async addProjectMember(projectId, userId, role = 'member') {
    // Check if member already exists
    const existingMember = await pgCore('project_members')
      .where({ project_id: projectId, user_id: userId })
      .first()

    if (existingMember) {
      if (existingMember.is_active) {
        throw new Error('User sudah menjadi member project ini')
      } else {
        // Reactivate existing member
        const [member] = await pgCore('project_members')
          .where({ project_id: projectId, user_id: userId })
          .update({ role, is_active: true })
          .returning('*')
        return member
      }
    }

    const [member] = await pgCore('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role
      })
      .returning('*')
    
    return member
  }

  async updateProjectMember(projectId, userId, role) {
    const [member] = await pgCore('project_members')
      .where({ project_id: projectId, user_id: userId })
      .update({ role })
      .returning('*')
    
    return member
  }

  async removeProjectMember(projectId, userId) {
    await pgCore('project_members')
      .where({ project_id: projectId, user_id: userId })
      .update({ is_active: false })
    
    return true
  }

  async checkUserPermission(projectId, userId, allowedRoles = []) {
    // Check if user is project creator
    const project = await pgCore('projects')
      .where({ id: projectId, created_by: userId })
      .first()
    
    if (project) return true

    // Check project member role
    const member = await pgCore('project_members')
      .where({ project_id: projectId, user_id: userId, is_active: true })
      .first()
    
    if (member && allowedRoles.includes(member.role)) {
      return true
    }

    // Check team member role
    const teamMember = await pgCore('team_members')
      .select('team_members.*')
      .leftJoin('projects', 'team_members.team_id', 'projects.team_id')
      .where('projects.id', projectId)
      .where('team_members.user_id', userId)
      .where('team_members.is_active', true)
      .first()
    
    if (teamMember && allowedRoles.includes(teamMember.role)) {
      return true
    }

    return false
  }

  async getProjectStats(projectId) {
    // Get task statistics
    const taskStats = await pgCore('tasks')
      .where('project_id', projectId)
      .where('is_active', true)
      .groupBy('status')
      .select('status')
      .count('* as count')

    // Get member count
    const memberCount = await pgCore('project_members')
      .where('project_id', projectId)
      .where('is_active', true)
      .count('* as count')
      .first()

    // Get overdue tasks
    const overdueTasks = await pgCore('tasks')
      .where('project_id', projectId)
      .where('is_active', true)
      .where('due_date', '<', new Date())
      .whereNot('status', 'done')
      .count('* as count')
      .first()

    return {
      tasks: taskStats,
      members: parseInt(memberCount.count),
      overdue_tasks: parseInt(overdueTasks.count)
    }
  }
}

module.exports = new ProjectRepository()
