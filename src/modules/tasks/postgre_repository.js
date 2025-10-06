const { pgCore } = require('../../config/database')

class TaskRepository {
  async createTask(taskData) {
    // Get next position for the task
    const maxPosition = await pgCore('tasks')
      .where('project_id', taskData.project_id)
      .where('status', taskData.status || 'todo')
      .max('position as max_position')
      .first()

    const nextPosition = (maxPosition?.max_position || 0) + 1

    const [task] = await pgCore('tasks')
      .insert({
        ...taskData,
        position: nextPosition
      })
      .returning('*')
    
    return task
  }

  async getTasks(filters = {}) {
    const { 
      page = 1, 
      limit = 10, 
      project_id, 
      status, 
      priority, 
      assigned_to, 
      search,
      due_date_from,
      due_date_to,
      user_id 
    } = filters
    const offset = (page - 1) * limit

    let query = pgCore('tasks')
      .select([
        'tasks.*',
        'projects.name as project_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email',
        'parent.title as parent_title'
      ])
      .leftJoin('projects', 'tasks.project_id', 'projects.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('tasks as parent', 'tasks.parent_task_id', 'parent.id')
      .where('tasks.is_active', true)

    // Filter by user access (user must be member of project)
    if (user_id) {
      query = query.whereExists(function() {
        this.select('*')
          .from('project_members')
          .whereRaw('project_members.project_id = tasks.project_id')
          .where('project_members.user_id', user_id)
          .where('project_members.is_active', true)
      })
    }

    if (project_id) {
      query = query.where('tasks.project_id', project_id)
    }

    if (status) {
      query = query.where('tasks.status', status)
    }

    if (priority) {
      query = query.where('tasks.priority', priority)
    }

    if (assigned_to) {
      query = query.where('tasks.assigned_to', assigned_to)
    }

    if (search) {
      query = query.where(function() {
        this.whereILike('tasks.title', `%${search}%`)
          .orWhereILike('tasks.description', `%${search}%`)
      })
    }

    if (due_date_from) {
      query = query.where('tasks.due_date', '>=', due_date_from)
    }

    if (due_date_to) {
      query = query.where('tasks.due_date', '<=', due_date_to)
    }

    const tasks = await query
      .orderBy('tasks.position', 'asc')
      .orderBy('tasks.created_at', 'desc')
      .limit(limit)
      .offset(offset)

    // Get total count
    let countQuery = pgCore('tasks').where('is_active', true)
    
    if (user_id) {
      countQuery = countQuery.whereExists(function() {
        this.select('*')
          .from('project_members')
          .whereRaw('project_members.project_id = tasks.project_id')
          .where('project_members.user_id', user_id)
          .where('project_members.is_active', true)
      })
    }

    if (project_id) {
      countQuery = countQuery.where('project_id', project_id)
    }

    if (status) {
      countQuery = countQuery.where('status', status)
    }

    if (priority) {
      countQuery = countQuery.where('priority', priority)
    }

    if (assigned_to) {
      countQuery = countQuery.where('assigned_to', assigned_to)
    }

    if (search) {
      countQuery = countQuery.where(function() {
        this.whereILike('title', `%${search}%`)
          .orWhereILike('description', `%${search}%`)
      })
    }

    if (due_date_from) {
      countQuery = countQuery.where('due_date', '>=', due_date_from)
    }

    if (due_date_to) {
      countQuery = countQuery.where('due_date', '<=', due_date_to)
    }

    const total = await countQuery.count('* as count').first()

    return {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getTaskById(id, userId = null) {
    let query = pgCore('tasks')
      .select([
        'tasks.*',
        'projects.name as project_name',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'creator.email as creator_email',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email',
        'parent.title as parent_title'
      ])
      .leftJoin('projects', 'tasks.project_id', 'projects.id')
      .leftJoin('users as creator', 'tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .leftJoin('tasks as parent', 'tasks.parent_task_id', 'parent.id')
      .where('tasks.id', id)
      .where('tasks.is_active', true)

    // Check user access
    if (userId) {
      query = query.whereExists(function() {
        this.select('*')
          .from('project_members')
          .whereRaw('project_members.project_id = tasks.project_id')
          .where('project_members.user_id', userId)
          .where('project_members.is_active', true)
      })
    }

    const task = await query.first()
    return task
  }

  async updateTask(id, updateData, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah task ini')
      }
    }

    const [task] = await pgCore('tasks')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return task
  }

  async deleteTask(id, userId = null) {
    // Check if user has permission to delete
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menghapus task ini')
      }
    }

    // Soft delete
    await pgCore('tasks')
      .where({ id })
      .update({ is_active: false })
    
    return true
  }

  async updateTaskStatus(id, status, position = null, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah task ini')
      }
    }

    const updateData = { status }
    if (position !== null) {
      updateData.position = position
    }

    const [task] = await pgCore('tasks')
      .where({ id })
      .update(updateData)
      .returning('*')
    
    return task
  }

  async assignTask(id, assignedTo, userId = null) {
    // Check if user has permission to assign
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah task ini')
      }
    }

    const [task] = await pgCore('tasks')
      .where({ id })
      .update({ assigned_to: assignedTo })
      .returning('*')
    
    return task
  }

  async updateTaskPosition(id, position, userId = null) {
    // Check if user has permission to update
    if (userId) {
      const hasPermission = await this.checkUserPermission(id, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk mengubah task ini')
      }
    }

    const [task] = await pgCore('tasks')
      .where({ id })
      .update({ position })
      .returning('*')
    
    return task
  }

  async getSubtasks(parentTaskId, userId = null) {
    let query = pgCore('tasks')
      .select([
        'tasks.*',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email'
      ])
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .where('tasks.parent_task_id', parentTaskId)
      .where('tasks.is_active', true)

    // Check user access
    if (userId) {
      query = query.whereExists(function() {
        this.select('*')
          .from('project_members')
          .whereRaw('project_members.project_id = tasks.project_id')
          .where('project_members.user_id', userId)
          .where('project_members.is_active', true)
      })
    }

    const subtasks = await query
      .orderBy('tasks.position', 'asc')
      .orderBy('tasks.created_at', 'asc')
    
    return subtasks
  }

  async addAttachment(taskId, attachmentData, userId = null) {
    // Check if user has permission
    if (userId) {
      const hasPermission = await this.checkUserPermission(taskId, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menambah attachment')
      }
    }

    // Get current task
    const task = await pgCore('tasks').where('id', taskId).first()
    if (!task) {
      throw new Error('Task tidak ditemukan')
    }

    // Get current attachments
    const currentAttachments = task.attachments || []
    
    // Add new attachment
    const newAttachment = {
      id: require('uuid').v4(),
      ...attachmentData,
      uploaded_at: new Date()
    }
    
    currentAttachments.push(newAttachment)

    // Update task
    const [updatedTask] = await pgCore('tasks')
      .where({ id: taskId })
      .update({ attachments: currentAttachments })
      .returning('*')
    
    return updatedTask
  }

  async removeAttachment(taskId, attachmentId, userId = null) {
    // Check if user has permission
    if (userId) {
      const hasPermission = await this.checkUserPermission(taskId, userId)
      if (!hasPermission) {
        throw new Error('Tidak memiliki akses untuk menghapus attachment')
      }
    }

    // Get current task
    const task = await pgCore('tasks').where('id', taskId).first()
    if (!task) {
      throw new Error('Task tidak ditemukan')
    }

    // Get current attachments
    const currentAttachments = task.attachments || []
    
    // Remove attachment
    const updatedAttachments = currentAttachments.filter(att => att.id !== attachmentId)

    // Update task
    const [updatedTask] = await pgCore('tasks')
      .where({ id: taskId })
      .update({ attachments: updatedAttachments })
      .returning('*')
    
    return updatedTask
  }

  async checkUserPermission(taskId, userId) {
    // Check if user is task creator
    const task = await pgCore('tasks')
      .where({ id: taskId, created_by: userId })
      .first()
    
    if (task) return true

    // Check if user is assigned to task
    const assignedTask = await pgCore('tasks')
      .where({ id: taskId, assigned_to: userId })
      .first()
    
    if (assignedTask) return true

    // Check if user is project member with appropriate role
    const projectMember = await pgCore('project_members')
      .select('project_members.*')
      .leftJoin('tasks', 'project_members.project_id', 'tasks.project_id')
      .where('tasks.id', taskId)
      .where('project_members.user_id', userId)
      .where('project_members.is_active', true)
      .whereIn('project_members.role', ['owner', 'admin', 'member'])
      .first()
    
    if (projectMember) return true

    return false
  }

  async getTasksByProject(projectId, status = null) {
    let query = pgCore('tasks')
      .select([
        'tasks.*',
        'assignee.first_name as assignee_first_name',
        'assignee.last_name as assignee_last_name',
        'assignee.email as assignee_email'
      ])
      .leftJoin('users as assignee', 'tasks.assigned_to', 'assignee.id')
      .where('tasks.project_id', projectId)
      .where('tasks.is_active', true)
      .whereNull('tasks.parent_task_id') // Only parent tasks

    if (status) {
      query = query.where('tasks.status', status)
    }

    const tasks = await query
      .orderBy('tasks.position', 'asc')
      .orderBy('tasks.created_at', 'asc')
    
    return tasks
  }
}

module.exports = new TaskRepository()
