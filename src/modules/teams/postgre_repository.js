const { pgCore } = require('../../config/database')

class TeamRepository {
  async createTeam(teamData) {
    const [team] = await pgCore('teams')
      .insert(teamData)
      .returning('*')
    
    return team
  }

  async getTeams(filters = {}) {
    const { page = 1, limit = 10, search, user_id } = filters
    const offset = (page - 1) * limit

    let query = pgCore('teams')
      .select([
        'teams.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name'
      ])
      .leftJoin('users as creator', 'teams.created_by', 'creator.id')
      .where('teams.is_active', true)

    // Filter by user access (user must be member of team)
    if (user_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('team_members')
          .whereRaw('team_members.team_id = teams.id')
          .where('team_members.user_id', user_id)
          .where('team_members.is_active', true)
      })
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('teams.name', `%${search}%`)
          .orWhereILike('teams.description', `%${search}%`)
      })
    }

    const teams = await query
      .orderBy('teams.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    // Get total count
    let countQuery = pgCore('teams').where('is_active', true)
    
    if (user_id) {
      countQuery = countQuery.whereExists(function() {
        this.select('*')
          .from('team_members')
          .whereRaw('team_members.team_id = teams.id')
          .where('team_members.user_id', user_id)
          .where('team_members.is_active', true)
      })
    }

    if (search) {
      countQuery = countQuery.where(function() {
        this.whereILike('name', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
      })
    }

    const total = await countQuery.count('* as count').first()

    return {
      teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getTeamById(id, userId = null) {
    let query = pgCore('teams')
      .select([
        'teams.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.email as creator_email'
      ])
      .leftJoin('users as creator', 'teams.created_by', 'creator.id')
      .where('teams.id', id)
      .where('teams.is_active', true)

    // Check user access
    if (userId) {
      query = query.whereExists(function() {
        this.select('*')
          .from('team_members')
          .whereRaw('team_members.team_id = teams.id')
          .where('team_members.user_id', userId)
          .where('team_members.is_active', true)
      })
    }

    const team = await query.first()
    return team
  }

  async updateTeam(id, updateData, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah team ini')
      }
    }

    const [team] = await pgCore('teams')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return team
  }

  async deleteTeam(id, userId = null) {
    // Check if user has permission to delete
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId, ['owner'])
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menghapus team ini')
      }
    }

    // Soft delete
    await pgCore('teams')
      .where({ id })
      .update({ is_active: false })
    
    return true
  }

  async getTeamMembers(teamId) {
    const members = await pgCore('team_members')
      .select([
        'team_members.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.avatar_url'
      ])
      .leftJoin('users', 'team_members.user_id', 'users.id')
      .where('team_members.team_id', teamId)
      .where('team_members.is_active', true)
      .orderBy('team_members.created_at', 'asc')
    
    return members
  }

  async addTeamMember(teamId, userId, role = 'member') {
    // Check if member already exists
    const existingMember = await pgCore('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first()

    if (existingMember) {
      if (existingMember.is_active) {
        throw new Error('User sudah menjadi member team ini')
      } else {
        // Reactivate existing member
        const [member] = await pgCore('team_members')
          .where({ team_id: teamId, user_id: userId })
          .update({ role, is_active: true })
          .returning('*')
        return member
      }
    }

    const [member] = await pgCore('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      })
      .returning('*')
    
    return member
  }

  async updateTeamMember(teamId, userId, role) {
    const [member] = await pgCore('team_members')
      .where({ team_id: teamId, user_id: userId })
      .update({ role })
      .returning('*')
    
    return member
  }

  async removeTeamMember(teamId, userId) {
    await pgCore('team_members')
      .where({ team_id: teamId, user_id: userId })
      .update({ is_active: false })
    
    return true
  }

  async checkUserPermission(teamId, userId, allowedRoles = []) {
    // Check if user is team creator
    const team = await pgCore('teams')
      .where({ id: teamId, created_by: userId })
      .first()
    
    if (team) return true

    // Check team member role
    const member = await pgCore('team_members')
      .where({ team_id: teamId, user_id: userId, is_active: true })
      .first()
    
    if (member && allowedRoles.includes(member.role)) {
      return true
    }

    return false
  }
}

module.exports = new TeamRepository()
