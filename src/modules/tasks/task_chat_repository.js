const { pgCore } = require('../../config/database')

class TaskChatRepository {
  async getTaskChat(taskId, filters = {}) {
    const query = pgCore('task_chat as tc')
      .select([
        'tc.*',
        'u.first_name',
        'u.last_name',
        'u.email',
        'reply_user.first_name as reply_first_name',
        'reply_user.last_name as reply_last_name'
      ])
      .leftJoin('users as u', 'tc.user_id', 'u.id')
      .leftJoin('task_chat as reply', 'tc.reply_to', 'reply.id')
      .leftJoin('users as reply_user', 'reply.user_id', 'reply_user.id')
      .where('tc.task_id', taskId)
      .where('tc.is_deleted', false)
      .orderBy('tc.created_at', 'asc')

    if (filters.limit) {
      query.limit(filters.limit)
    }
    if (filters.offset) {
      query.offset(filters.offset)
    }

    return await query
  }

  async createChatMessage(taskId, messageData, userId) {
    const [chatMessage] = await pgCore('task_chat')
      .insert({
        task_id: taskId,
        user_id: userId,
        message: messageData.message,
        attachments: messageData.attachments ? JSON.stringify(messageData.attachments) : null,
        reply_to: messageData.reply_to || null
      })
      .returning('*')

    return chatMessage
  }

  async updateChatMessage(messageId, messageData, userId) {
    const [chatMessage] = await pgCore('task_chat')
      .where('id', messageId)
      .where('user_id', userId) // Only message owner can edit
      .update({
        message: messageData.message,
        is_edited: true,
        edited_at: pgCore.fn.now()
      })
      .returning('*')

    return chatMessage
  }

  async deleteChatMessage(messageId, userId) {
    const [chatMessage] = await pgCore('task_chat')
      .where('id', messageId)
      .where('user_id', userId) // Only message owner can delete
      .update({
        is_deleted: true,
        deleted_at: pgCore.fn.now()
      })
      .returning('*')

    return chatMessage
  }

  async getChatMessage(messageId) {
    const message = await pgCore('task_chat as tc')
      .select([
        'tc.*',
        'u.first_name',
        'u.last_name',
        'u.email'
      ])
      .leftJoin('users as u', 'tc.user_id', 'u.id')
      .where('tc.id', messageId)
      .where('tc.is_deleted', false)
      .first()

    return message
  }

  async getChatStats(taskId) {
    const stats = await pgCore('task_chat')
      .where('task_id', taskId)
      .where('is_deleted', false)
      .count('* as total_messages')
      .first()

    return stats
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

module.exports = new TaskChatRepository()
