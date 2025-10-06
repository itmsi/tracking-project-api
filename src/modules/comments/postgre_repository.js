const { pgCore } = require('../../config/database')

class CommentRepository {
  async createComment(commentData) {
    const [comment] = await pgCore('comments')
      .insert(commentData)
      .returning('*')
    
    return comment
  }

  async getComments(taskId, filters = {}) {
    const { page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    const comments = await pgCore('comments')
      .select([
        'comments.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.avatar_url'
      ])
      .leftJoin('users', 'comments.user_id', 'users.id')
      .where('comments.task_id', taskId)
      .where('comments.is_active', true)
      .orderBy('comments.created_at', 'asc')
      .limit(limit)
      .offset(offset)

    const total = await pgCore('comments')
      .where('task_id', taskId)
      .where('is_active', true)
      .count('* as count')
      .first()

    return {
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getCommentById(id, userId = null) {
    let query = pgCore('comments')
      .select([
        'comments.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.avatar_url'
      ])
      .leftJoin('users', 'comments.user_id', 'users.id')
      .where('comments.id', id)
      .where('comments.is_active', true)

    // Check user access through task project membership
    if (userId) {
      query = query.whereExists(function() {
        this.select('*')
          .from('project_members')
          .leftJoin('tasks', 'project_members.project_id', 'tasks.project_id')
          .leftJoin('comments', 'tasks.id', 'comments.task_id')
          .whereRaw('comments.id = ?', [id])
          .where('project_members.user_id', userId)
          .where('project_members.is_active', true)
      })
    }

    const comment = await query.first()
    return comment
  }

  async updateComment(id, updateData, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah komentar ini')
      }
    }

    const [comment] = await pgCore('comments')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return comment
  }

  async deleteComment(id, userId = null) {
    // Check if user has permission to delete
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menghapus komentar ini')
      }
    }

    // Soft delete
    await pgCore('comments')
      .where({ id })
      .update({ is_active: false })
    
    return true
  }

  async checkUserPermission(commentId, userId) {
    // Check if user is comment creator
    const comment = await pgCore('comments')
      .where({ id: commentId, user_id: userId })
      .first()
    
    if (comment) return true

    // Check if user is project member with appropriate role
    const projectMember = await pgCore('project_members')
      .select('project_members.*')
      .leftJoin('tasks', 'project_members.project_id', 'tasks.project_id')
      .leftJoin('comments', 'tasks.id', 'comments.task_id')
      .where('comments.id', commentId)
      .where('project_members.user_id', userId)
      .where('project_members.is_active', true)
      .whereIn('project_members.role', ['owner', 'admin'])
      .first()
    
    if (projectMember) return true

    return false
  }
}

module.exports = new CommentRepository()
