const { pgCore } = require('../../config/database')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

class UploadRepository {
  async createFileRecord(fileData) {
    const [file] = await pgCore('file_uploads')
      .insert(fileData)
      .returning('*')
    
    return file
  }

  async getFileById(id, userId) {
    const file = await pgCore('file_uploads')
      .where({
        id,
        user_id: userId,
        is_active: true
      })
      .first()

    return file
  }

  async getFiles(userId, filters = {}) {
    const { type, task_id, project_id, page = 1, limit = 20 } = filters
    const offset = (page - 1) * limit

    let whereConditions = {
      user_id: userId,
      is_active: true
    }

    if (type) {
      whereConditions.type = type
    }

    if (task_id) {
      whereConditions.task_id = task_id
    }

    if (project_id) {
      whereConditions.project_id = project_id
    }

    const files = await pgCore('file_uploads')
      .where(whereConditions)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const total = await pgCore('file_uploads')
      .where(whereConditions)
      .count('* as count')
      .first()

    return {
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async deleteFile(id, userId) {
    // Get file record first
    const file = await this.getFileById(id, userId)
    if (!file) {
      return false
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), 'uploads', file.file_path)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error('Error deleting physical file:', error)
    }

    // Soft delete database record
    const result = await pgCore('file_uploads')
      .where({ id, user_id: userId })
      .update({ is_active: false })

    return result > 0
  }

  async generateUniqueFileName(originalName, userId) {
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const extension = path.extname(originalName)
    const baseName = path.basename(originalName, extension)
    
    return `${userId}_${timestamp}_${randomString}_${baseName}${extension}`
  }

  async getFileStats(userId) {
    const stats = await pgCore('file_uploads')
      .select([
        'type',
        pgCore.raw('COUNT(*) as count'),
        pgCore.raw('SUM(file_size) as total_size')
      ])
      .where({
        user_id: userId,
        is_active: true
      })
      .groupBy('type')

    return stats
  }

  async getFileUsageByProject(userId) {
    const usage = await pgCore('file_uploads')
      .select([
        'projects.name as project_name',
        'projects.id as project_id',
        pgCore.raw('COUNT(file_uploads.id) as file_count'),
        pgCore.raw('SUM(file_uploads.file_size) as total_size')
      ])
      .leftJoin('projects', 'file_uploads.project_id', 'projects.id')
      .where({
        'file_uploads.user_id': userId,
        'file_uploads.is_active': true
      })
      .whereNotNull('file_uploads.project_id')
      .groupBy('projects.id', 'projects.name')
      .orderBy(pgCore.raw('COUNT(file_uploads.id)'), 'desc')

    return usage
  }

  async getFileUsageByTask(userId) {
    const usage = await pgCore('file_uploads')
      .select([
        'tasks.title as task_title',
        'tasks.id as task_id',
        'projects.name as project_name',
        pgCore.raw('COUNT(file_uploads.id) as file_count'),
        pgCore.raw('SUM(file_uploads.file_size) as total_size')
      ])
      .leftJoin('tasks', 'file_uploads.task_id', 'tasks.id')
      .leftJoin('projects', 'tasks.project_id', 'projects.id')
      .where({
        'file_uploads.user_id': userId,
        'file_uploads.is_active': true
      })
      .whereNotNull('file_uploads.task_id')
      .groupBy('tasks.id', 'tasks.title', 'projects.name')
      .orderBy(pgCore.raw('COUNT(file_uploads.id)'), 'desc')
      .limit(10)

    return usage
  }

  async validateFileAccess(fileId, userId, type = null) {
    let whereConditions = {
      id: fileId,
      user_id: userId,
      is_active: true
    }

    if (type) {
      whereConditions.type = type
    }

    const file = await pgCore('file_uploads')
      .where(whereConditions)
      .first()

    if (!file) {
      return false
    }

    // Additional access checks based on file type
    if (file.type === 'task_attachment' && file.task_id) {
      // Check if user has access to the task's project
      const hasAccess = await pgCore('project_members')
        .select('*')
        .leftJoin('tasks', 'project_members.project_id', 'tasks.project_id')
        .where('tasks.id', file.task_id)
        .where('project_members.user_id', userId)
        .where('project_members.is_active', true)
        .first()

      return !!hasAccess
    }

    if (file.type === 'project_file' && file.project_id) {
      // Check if user has access to the project
      const hasAccess = await pgCore('project_members')
        .where({
          project_id: file.project_id,
          user_id: userId,
          is_active: true
        })
        .first()

      return !!hasAccess
    }

    return true
  }
}

module.exports = new UploadRepository()
