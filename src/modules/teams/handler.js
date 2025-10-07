const { response } = require('../../utils')
const teamRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class TeamHandler {
  async getTeams(req, res, next) {
    try {
      const userId = req.user.id
      const filters = {
        ...req.query,
        user_id: userId
      }

      const result = await teamRepository.getTeams(filters)
      
      return response.success(res, 200, 'Daftar team berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async createTeam(req, res, next) {
    try {
      const userId = req.user.id
      const teamData = {
        ...req.body,
        created_by: userId
      }

      // Convert status to is_active if provided
      if (teamData.status) {
        teamData.is_active = teamData.status === 'active'
        delete teamData.status
      }

      const team = await teamRepository.createTeam(teamData)

      // Add creator as team owner
      await teamRepository.addTeamMember(team.id, userId, 'owner')

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'team',
        entity_id: team.id,
        new_values: team,
        description: `Team "${team.name}" dibuat`
      })

      return response.success(res, 201, 'Team berhasil dibuat', team)
    } catch (error) {
      next(error)
    }
  }

  async getTeam(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const team = await teamRepository.getTeamById(id, userId)
      if (!team) {
        return response.error(res, 404, 'Team tidak ditemukan')
      }

      return response.success(res, 200, 'Team berhasil diambil', team)
    } catch (error) {
      next(error)
    }
  }

  async updateTeam(req, res, next) {
    try {
      console.log('=== Handler updateTeam START ===');
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      // Convert status to is_active if provided
      if (updateData.status) {
        updateData.is_active = updateData.status === 'active'
        delete updateData.status
      }

      // Get old team data for activity log
      const oldTeam = await teamRepository.getTeamById(id, userId)
      if (!oldTeam) {
        return response.error(res, 404, 'Team tidak ditemukan')
      }

      const team = await teamRepository.updateTeam(id, updateData, userId)
      console.log('Team updated:', team ? 'SUCCESS' : 'NULL');

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'team',
        entity_id: id,
        old_values: oldTeam,
        new_values: team,
        description: `Team "${team.name}" diperbarui`
      })

      return response.success(res, 200, 'Team berhasil diperbarui', team)
    } catch (error) {
      console.error('=== Handler updateTeam ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async deleteTeam(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Get team data for activity log
      const team = await teamRepository.getTeamById(id, userId)
      if (!team) {
        return response.error(res, 404, 'Team tidak ditemukan')
      }

      await teamRepository.deleteTeam(id, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'team',
        entity_id: id,
        old_values: team,
        description: `Team "${team.name}" dihapus`
      })

      return response.success(res, 200, 'Team berhasil dihapus')
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async getTeamMembers(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Check if user has access to team
      const team = await teamRepository.getTeamById(id, userId)
      if (!team) {
        return response.error(res, 404, 'Team tidak ditemukan')
      }

      const members = await teamRepository.getTeamMembers(id)
      
      return response.success(res, 200, 'Daftar member team berhasil diambil', members)
    } catch (error) {
      next(error)
    }
  }

  async addTeamMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { user_id, role } = req.body

      // Check if user has permission to add members
      const hasPermission = await teamRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menambah member')
      }

      const member = await teamRepository.addTeamMember(id, user_id, role)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'added_member',
        entity_type: 'team',
        entity_id: id,
        new_values: { user_id, role },
        description: `Member ditambahkan ke team`
      })

      return response.success(res, 201, 'Member berhasil ditambahkan', member)
    } catch (error) {
      if (error.message.includes('sudah menjadi member')) {
        return response.error(res, 400, error.message)
      }
      next(error)
    }
  }

  async updateTeamMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, userId: memberUserId } = req.params
      const { role } = req.body

      // Check if user has permission to update members
      const hasPermission = await teamRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah member')
      }

      const member = await teamRepository.updateTeamMember(id, memberUserId, role)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated_member',
        entity_type: 'team',
        entity_id: id,
        new_values: { user_id: memberUserId, role },
        description: `Role member diubah menjadi ${role}`
      })

      return response.success(res, 200, 'Member berhasil diperbarui', member)
    } catch (error) {
      next(error)
    }
  }

  async removeTeamMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, userId: memberUserId } = req.params

      // Check if user has permission to remove members
      const hasPermission = await teamRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menghapus member')
      }

      await teamRepository.removeTeamMember(id, memberUserId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'removed_member',
        entity_type: 'team',
        entity_id: id,
        new_values: { user_id: memberUserId },
        description: `Member dihapus dari team`
      })

      return response.success(res, 200, 'Member berhasil dihapus')
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new TeamHandler()
