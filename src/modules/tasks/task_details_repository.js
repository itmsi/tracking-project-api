const { pgCore } = require('../../config/database')

class TaskDetailsRepository {
  async getTaskDetails(taskId, userId) {
    const query = pgCore('task_details as td')
      .select([
        'td.*',
        'creator.first_name as creator_first_name',
        'creator.last_name as creator_last_name',
        'updater.first_name as updater_first_name',
        'updater.last_name as updater_last_name'
      ])
      .leftJoin('users as creator', 'td.created_by', 'creator.id')
      .leftJoin('users as updater', 'td.updated_by', 'updater.id')
      .where('td.task_id', taskId)
      .first()

    return await query
  }

  async createTaskDetails(taskId, detailsData, userId) {
    const [taskDetails] = await pgCore('task_details')
      .insert({
        task_id: taskId,
        description: detailsData.description,
        requirements: detailsData.requirements,
        acceptance_criteria: detailsData.acceptance_criteria,
        metadata: detailsData.metadata ? JSON.stringify(detailsData.metadata) : null,
        created_by: userId
      })
      .returning('*')

    return taskDetails
  }

  async updateTaskDetails(taskId, detailsData, userId) {
    const updateData = {
      updated_by: userId
    }

    if (detailsData.description !== undefined) {
      updateData.description = detailsData.description
    }
    if (detailsData.requirements !== undefined) {
      updateData.requirements = detailsData.requirements
    }
    if (detailsData.acceptance_criteria !== undefined) {
      updateData.acceptance_criteria = detailsData.acceptance_criteria
    }
    if (detailsData.metadata !== undefined) {
      updateData.metadata = detailsData.metadata ? JSON.stringify(detailsData.metadata) : null
    }

    const [taskDetails] = await pgCore('task_details')
      .where('task_id', taskId)
      .update(updateData)
      .returning('*')

    return taskDetails
  }

  async deleteTaskDetails(taskId) {
    await pgCore('task_details')
      .where('task_id', taskId)
      .del()
  }

  async checkTaskAccess(taskId, userId) {
    // Check if user has access to this task
    const task = await pgCore('tasks as t')
      .select('t.*')
      .leftJoin('task_members as tm', function() {
        this.on('t.id', '=', 'tm.task_id')
      })
      .where('t.id', taskId)
      .where(function() {
        this.where('t.created_by', userId)
          .orWhere('tm.user_id', userId)
      })
      .first()

    return !!task
  }
}

module.exports = new TaskDetailsRepository()
