const { response } = require('../../utils')
const commentRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class CommentHandler {
  async getComments(req, res, next) {
    try {
      const userId = req.user.id
      const { task_id, project_id } = req.query

      const result = await commentRepository.getComments({ task_id, project_id }, req.query)
      
      return response.success(res, 200, 'Daftar komentar berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async createComment(req, res, next) {
    try {
      const userId = req.user.id
      const { task_id, project_id, content, parent_comment_id, attachments } = req.body
      
      const commentData = {
        content,
        task_id,
        project_id,
        parent_comment_id,
        attachments,
        user_id: userId
      }

      const comment = await commentRepository.createComment(commentData)

      // Create activity log
      const entityType = task_id ? 'task' : 'project'
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'comment',
        entity_id: comment.id,
        new_values: comment,
        description: `Komentar ditambahkan pada ${entityType}`
      })

      return response.success(res, 201, 'Komentar berhasil ditambahkan', comment)
    } catch (error) {
      next(error)
    }
  }

  async updateComment(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      // Get old comment data for activity log
      const oldComment = await commentRepository.getCommentById(id, userId)
      if (!oldComment) {
        return response.error(res, 404, 'Komentar tidak ditemukan')
      }

      const comment = await commentRepository.updateComment(id, updateData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'comment',
        entity_id: id,
        old_values: oldComment,
        new_values: comment,
        description: `Komentar diperbarui`
      })

      return response.success(res, 200, 'Komentar berhasil diperbarui', comment)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async deleteComment(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Get comment data for activity log
      const comment = await commentRepository.getCommentById(id, userId)
      if (!comment) {
        return response.error(res, 404, 'Komentar tidak ditemukan')
      }

      await commentRepository.deleteComment(id, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'comment',
        entity_id: id,
        old_values: comment,
        description: `Komentar dihapus`
      })

      return response.success(res, 200, 'Komentar berhasil dihapus')
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }
}

module.exports = new CommentHandler()
