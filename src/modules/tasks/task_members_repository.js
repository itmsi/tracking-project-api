const { pgCore } = require('../../config/database')

class TaskMembersRepository {
  async getTaskMembers(taskId, filters = {}) {
    const query = pgCore('task_members as tm')
      .select([
        'tm.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.avatar_url',
        'adder.first_name as added_by_first_name',
        'adder.last_name as added_by_last_name'
      ])
      .leftJoin('users as u', 'tm.user_id', 'u.id')
      .leftJoin('users as adder', 'tm.added_by', 'adder.id')
      .where('tm.task_id', taskId)
      .orderBy('tm.joined_at', 'asc')

    if (filters.role) {
      query.where('tm.role', filters.role)
    }
    if (filters.limit) {
      query.limit(filters.limit)
    }
    if (filters.offset) {
      query.offset(filters.offset)
    }

    return await query
  }

  async addTaskMember(taskId, userId, memberData, addedBy) {
    // Check if user is already a member
    const existingMember = await pgCore('task_members')
      .where('task_id', taskId)
      .where('user_id', userId)
      .first()

    if (existingMember) {
      throw new Error('User sudah menjadi member task ini')
    }

    const [member] = await pgCore('task_members')
      .insert({
        task_id: taskId,
        user_id: userId,
        role: memberData.role || 'member',
        can_edit: memberData.can_edit !== undefined ? memberData.can_edit : true,
        can_comment: memberData.can_comment !== undefined ? memberData.can_comment : true,
        can_upload: memberData.can_upload !== undefined ? memberData.can_upload : true,
        added_by: addedBy
      })
      .returning('*')

    return member
  }

  async updateTaskMember(taskId, userId, memberData, updatedBy) {
    const updateData = {}

    if (memberData.role !== undefined) {
      updateData.role = memberData.role
    }
    if (memberData.can_edit !== undefined) {
      updateData.can_edit = memberData.can_edit
    }
    if (memberData.can_comment !== undefined) {
      updateData.can_comment = memberData.can_comment
    }
    if (memberData.can_upload !== undefined) {
      updateData.can_upload = memberData.can_upload
    }

    const [member] = await pgCore('task_members')
      .where('task_id', taskId)
      .where('user_id', userId)
      .update(updateData)
      .returning('*')

    return member
  }

  async removeTaskMember(taskId, userId, removedBy) {
    const member = await pgCore('task_members')
      .where('task_id', taskId)
      .where('user_id', userId)
      .first()

    if (!member) {
      return null
    }

    await pgCore('task_members')
      .where('task_id', taskId)
      .where('user_id', userId)
      .del()

    return member
  }

  async getTaskMember(taskId, userId) {
    const member = await pgCore('task_members as tm')
      .select([
        'tm.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'u.avatar_url'
      ])
      .leftJoin('users as u', 'tm.user_id', 'u.id')
      .where('tm.task_id', taskId)
      .where('tm.user_id', userId)
      .first()

    return member
  }

  async checkUserPermission(taskId, userId, requiredRoles = []) {
    // Check if user is task creator
    const task = await pgCore('tasks')
      .where('id', taskId)
      .where('created_by', userId)
      .first()

    if (task) {
      return { hasAccess: true, role: 'owner', isOwner: true }
    }

    // Check if user is task member
    const member = await pgCore('task_members')
      .where('task_id', taskId)
      .where('user_id', userId)
      .first()

    if (!member) {
      return { hasAccess: false, role: null, isOwner: false }
    }

    const hasRequiredRole = requiredRoles.length === 0 || requiredRoles.includes(member.role)
    
    return {
      hasAccess: hasRequiredRole,
      role: member.role,
      isOwner: false,
      permissions: {
        can_edit: member.can_edit,
        can_comment: member.can_comment,
        can_upload: member.can_upload
      }
    }
  }

  async getTaskMemberStats(taskId) {
    const stats = await pgCore('task_members')
      .where('task_id', taskId)
      .select([
        pgCore.raw('COUNT(*) as total_members'),
        pgCore.raw('COUNT(CASE WHEN role = \'owner\' THEN 1 END) as owner_count'),
        pgCore.raw('COUNT(CASE WHEN role = \'admin\' THEN 1 END) as admin_count'),
        pgCore.raw('COUNT(CASE WHEN role = \'member\' THEN 1 END) as member_count'),
        pgCore.raw('COUNT(CASE WHEN role = \'viewer\' THEN 1 END) as viewer_count')
      ])
      .first()

    return stats
  }

  async searchUsersForTask(taskId, searchTerm, limit = 10) {
    // Get users who are not already members of this task
    const existingMembers = await pgCore('task_members')
      .where('task_id', taskId)
      .pluck('user_id')

    const query = pgCore('users')
      .select(['id', 'first_name', 'last_name', 'email', 'avatar_url'])
      .whereNotIn('id', existingMembers)
      .where(function() {
        this.where('first_name', 'ilike', `%${searchTerm}%`)
          .orWhere('last_name', 'ilike', `%${searchTerm}%`)
          .orWhere('email', 'ilike', `%${searchTerm}%`)
      })
      .limit(limit)

    return await query
  }
}

module.exports = new TaskMembersRepository()
