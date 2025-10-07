const { response } = require('../../utils')
const taskRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class TaskHandler {
  async getTasks(req, res, next) {
    try {
      const userId = req.user.id
      const filters = {
        ...req.query,
        user_id: userId
      }

      const result = await taskRepository.getTasks(filters)
      
      return response.success(res, 200, 'Daftar task berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async createTask(req, res, next) {
    try {
      console.log('=== Handler createTask START ===');
      const userId = req.user.id
      const taskData = {
        ...req.body,
        created_by: userId
      }
      console.log('UserId:', userId);
      console.log('TaskData:', taskData);

      const task = await taskRepository.createTask(taskData)
      console.log('Task created:', task ? 'SUCCESS' : 'NULL');

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task',
        entity_id: task.id,
        new_values: task,
        description: `Task "${task.title}" dibuat`
      })

      return response.success(res, 201, 'Task berhasil dibuat', task)
    } catch (error) {
      console.error('=== Handler createTask ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      next(error)
    }
  }

  async getTask(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const task = await taskRepository.getTaskById(id, userId)
      if (!task) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      return response.success(res, 200, 'Task berhasil diambil', task)
    } catch (error) {
      next(error)
    }
  }

  async updateTask(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      // Get old task data for activity log
      const oldTask = await taskRepository.getTaskById(id, userId)
      if (!oldTask) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      const task = await taskRepository.updateTask(id, updateData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'task',
        entity_id: id,
        old_values: oldTask,
        new_values: task,
        description: `Task "${task.title}" diperbarui`
      })

      return response.success(res, 200, 'Task berhasil diperbarui', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async deleteTask(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Get task data for activity log
      const task = await taskRepository.getTaskById(id, userId)
      if (!task) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      await taskRepository.deleteTask(id, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'task',
        entity_id: id,
        old_values: task,
        description: `Task "${task.title}" dihapus`
      })

      return response.success(res, 200, 'Task berhasil dihapus')
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { status, position } = req.body

      // Get old task data for activity log
      const oldTask = await taskRepository.getTaskById(id, userId)
      if (!oldTask) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      const task = await taskRepository.updateTaskStatus(id, status, position, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated_status',
        entity_type: 'task',
        entity_id: id,
        old_values: { status: oldTask.status },
        new_values: { status: task.status },
        description: `Status task "${task.title}" diubah dari ${oldTask.status} menjadi ${task.status}`
      })

      return response.success(res, 200, 'Status task berhasil diperbarui', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async assignTask(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { assigned_to } = req.body

      // Get old task data for activity log
      const oldTask = await taskRepository.getTaskById(id, userId)
      if (!oldTask) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      const task = await taskRepository.assignTask(id, assigned_to, userId)

      // Create activity log
      const assigneeName = assigned_to ? 'ditetapkan ke user' : 'tidak ditetapkan'
      await createActivityLog({
        user_id: userId,
        action: 'assigned',
        entity_type: 'task',
        entity_id: id,
        old_values: { assigned_to: oldTask.assigned_to },
        new_values: { assigned_to: task.assigned_to },
        description: `Task "${task.title}" ${assigneeName}`
      })

      return response.success(res, 200, 'Task berhasil ditetapkan', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async updateTaskPosition(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { position } = req.body

      const task = await taskRepository.updateTaskPosition(id, position, userId)

      return response.success(res, 200, 'Posisi task berhasil diperbarui', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async getSubtasks(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Check if parent task exists and user has access
      const parentTask = await taskRepository.getTaskById(id, userId)
      if (!parentTask) {
        return response.error(res, 404, 'Task tidak ditemukan')
      }

      const subtasks = await taskRepository.getSubtasks(id, userId)
      
      return response.success(res, 200, 'Daftar subtask berhasil diambil', subtasks)
    } catch (error) {
      next(error)
    }
  }

  async createSubtask(req, res, next) {
    try {
      const userId = req.user.id
      const { id: parentTaskId } = req.params
      const subtaskData = {
        ...req.body,
        parent_task_id: parentTaskId,
        created_by: userId
      }

      // Check if parent task exists and user has access
      const parentTask = await taskRepository.getTaskById(parentTaskId, userId)
      if (!parentTask) {
        return response.error(res, 404, 'Task parent tidak ditemukan')
      }

      const subtask = await taskRepository.createTask(subtaskData)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'task',
        entity_id: subtask.id,
        new_values: subtask,
        description: `Subtask "${subtask.title}" dibuat untuk task "${parentTask.title}"`
      })

      return response.success(res, 201, 'Subtask berhasil dibuat', subtask)
    } catch (error) {
      next(error)
    }
  }

  async addAttachment(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const attachmentData = req.body

      const task = await taskRepository.addAttachment(id, attachmentData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'added_attachment',
        entity_type: 'task',
        entity_id: id,
        new_values: { filename: attachmentData.filename },
        description: `Attachment "${attachmentData.filename}" ditambahkan`
      })

      return response.success(res, 201, 'Attachment berhasil ditambahkan', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async removeAttachment(req, res, next) {
    try {
      const userId = req.user.id
      const { id, attachmentId } = req.params

      const task = await taskRepository.removeAttachment(id, attachmentId, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'removed_attachment',
        entity_type: 'task',
        entity_id: id,
        new_values: { attachment_id: attachmentId },
        description: `Attachment dihapus`
      })

      return response.success(res, 200, 'Attachment berhasil dihapus', task)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }
}

module.exports = new TaskHandler()
