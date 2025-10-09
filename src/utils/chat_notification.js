/**
 * Chat Notification Utility
 * 
 * Utility untuk membuat notifikasi otomatis ketika ada chat baru di task
 */

const notificationRepository = require('../modules/notifications/postgre_repository');
const taskMembersRepository = require('../modules/tasks/task_members_repository');
const { pgCore } = require('../config/database');

/**
 * Create notifications untuk semua member task ketika ada chat baru
 * 
 * @param {Object} params
 * @param {String} params.taskId - ID task
 * @param {String} params.senderId - ID user yang mengirim chat
 * @param {String} params.messageId - ID chat message
 * @param {String} params.message - Isi pesan
 * @param {Object} params.taskInfo - Info task (optional, untuk efisiensi)
 * @param {Object} params.senderInfo - Info sender (optional, untuk efisiensi)
 * @param {Function} params.websocketBroadcast - Function untuk broadcast via WebSocket (optional)
 */
async function createChatNotifications({ 
  taskId, 
  senderId, 
  messageId, 
  message,
  taskInfo = null,
  senderInfo = null,
  websocketBroadcast = null
}) {
  try {
    console.log(`📢 Creating chat notifications for task ${taskId}`);
    
    // 1. Get all task members (kecuali pengirim)
    const allMembers = await taskMembersRepository.getTaskMembers(taskId);
    
    // Filter out sender
    const membersToNotify = allMembers.filter(member => member.user_id !== senderId);
    
    if (membersToNotify.length === 0) {
      console.log('ℹ️  No other members to notify');
      return [];
    }
    
    // 2. Get task info if not provided
    if (!taskInfo) {
      taskInfo = await pgCore('tasks')
        .where('id', taskId)
        .select(['id', 'title', 'project_id'])
        .first();
    }
    
    // 3. Get sender info if not provided
    if (!senderInfo) {
      senderInfo = await pgCore('users')
        .where('id', senderId)
        .select(['id', 'first_name', 'last_name', 'email'])
        .first();
    }
    
    // 4. Prepare notification data for bulk insert
    const senderName = `${senderInfo.first_name} ${senderInfo.last_name}`;
    const truncatedMessage = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;
    
    const notificationsData = membersToNotify.map(member => ({
      user_id: member.user_id,
      sender_id: senderId,
      type: 'chat_message',
      title: `Pesan baru dari ${senderName}`,
      message: truncatedMessage,
      data: JSON.stringify({
        task_id: taskId,
        task_title: taskInfo.title,
        message_id: messageId,
        sender_name: senderName,
        sender_email: senderInfo.email,
        full_message: message
      }),
      is_read: false,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    // 5. Create notifications in bulk
    const notifications = await notificationRepository.createBulkNotifications(notificationsData);
    
    console.log(`✅ Created ${notifications.length} notifications for chat message ${messageId}`);
    
    // 6. Broadcast via WebSocket if function provided
    if (websocketBroadcast && typeof websocketBroadcast === 'function') {
      // Broadcast to each member
      membersToNotify.forEach((member, index) => {
        const notification = notifications[index];
        websocketBroadcast(member.user_id, {
          id: notification.id,
          type: 'chat_message',
          title: notification.title,
          message: notification.message,
          data: JSON.parse(notification.data),
          created_at: notification.created_at,
          is_read: false,
          sender: {
            id: senderId,
            name: senderName,
            email: senderInfo.email
          }
        });
      });
      
      console.log(`🔔 Broadcast ${notifications.length} notifications via WebSocket`);
    }
    
    return notifications;
    
  } catch (error) {
    console.error('❌ Error creating chat notifications:', error);
    throw error;
  }
}

/**
 * Create notification untuk mention di chat
 * 
 * @param {Object} params
 * @param {String} params.taskId - ID task
 * @param {String} params.senderId - ID user yang mengirim chat
 * @param {String} params.messageId - ID chat message
 * @param {String} params.message - Isi pesan
 * @param {Array} params.mentionedUserIds - Array of user IDs yang di-mention
 * @param {Function} params.websocketBroadcast - Function untuk broadcast via WebSocket (optional)
 */
async function createMentionNotifications({
  taskId,
  senderId,
  messageId,
  message,
  mentionedUserIds = [],
  websocketBroadcast = null
}) {
  try {
    if (!mentionedUserIds || mentionedUserIds.length === 0) {
      return [];
    }
    
    console.log(`📢 Creating mention notifications for ${mentionedUserIds.length} users`);
    
    // Get task info
    const taskInfo = await pgCore('tasks')
      .where('id', taskId)
      .select(['id', 'title'])
      .first();
    
    // Get sender info
    const senderInfo = await pgCore('users')
      .where('id', senderId)
      .select(['id', 'first_name', 'last_name', 'email'])
      .first();
    
    const senderName = `${senderInfo.first_name} ${senderInfo.last_name}`;
    const truncatedMessage = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;
    
    const notificationsData = mentionedUserIds
      .filter(userId => userId !== senderId) // Don't notify sender
      .map(userId => ({
        user_id: userId,
        sender_id: senderId,
        type: 'mention',
        title: `${senderName} menyebut Anda di chat`,
        message: truncatedMessage,
        data: JSON.stringify({
          task_id: taskId,
          task_title: taskInfo.title,
          message_id: messageId,
          sender_name: senderName,
          full_message: message
        }),
        is_read: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }));
    
    if (notificationsData.length === 0) {
      return [];
    }
    
    const notifications = await notificationRepository.createBulkNotifications(notificationsData);
    
    console.log(`✅ Created ${notifications.length} mention notifications`);
    
    // Broadcast via WebSocket if provided
    if (websocketBroadcast && typeof websocketBroadcast === 'function') {
      notificationsData.forEach((data, index) => {
        websocketBroadcast(data.user_id, {
          id: notifications[index].id,
          type: 'mention',
          title: data.title,
          message: data.message,
          data: JSON.parse(data.data),
          created_at: notifications[index].created_at,
          is_read: false,
          sender: {
            id: senderId,
            name: senderName,
            email: senderInfo.email
          }
        });
      });
    }
    
    return notifications;
    
  } catch (error) {
    console.error('❌ Error creating mention notifications:', error);
    throw error;
  }
}

/**
 * Create notification untuk reply chat
 * 
 * @param {Object} params
 * @param {String} params.taskId - ID task
 * @param {String} params.senderId - ID user yang mengirim reply
 * @param {String} params.messageId - ID chat message baru
 * @param {String} params.replyToMessageId - ID chat message yang dibalas
 * @param {String} params.message - Isi pesan reply
 * @param {Function} params.websocketBroadcast - Function untuk broadcast via WebSocket (optional)
 */
async function createReplyNotification({
  taskId,
  senderId,
  messageId,
  replyToMessageId,
  message,
  websocketBroadcast = null
}) {
  try {
    if (!replyToMessageId) {
      return null;
    }
    
    console.log(`📢 Creating reply notification for message ${replyToMessageId}`);
    
    // Get original message to find who to notify
    const originalMessage = await pgCore('task_chat')
      .where('id', replyToMessageId)
      .select(['user_id', 'message'])
      .first();
    
    if (!originalMessage) {
      console.log('⚠️  Original message not found');
      return null;
    }
    
    // Don't notify if replying to own message
    if (originalMessage.user_id === senderId) {
      console.log('ℹ️  Replying to own message, no notification needed');
      return null;
    }
    
    // Get task info
    const taskInfo = await pgCore('tasks')
      .where('id', taskId)
      .select(['id', 'title'])
      .first();
    
    // Get sender info
    const senderInfo = await pgCore('users')
      .where('id', senderId)
      .select(['id', 'first_name', 'last_name', 'email'])
      .first();
    
    const senderName = `${senderInfo.first_name} ${senderInfo.last_name}`;
    const truncatedMessage = message.length > 100 
      ? message.substring(0, 100) + '...' 
      : message;
    
    const notificationData = {
      user_id: originalMessage.user_id,
      sender_id: senderId,
      type: 'reply',
      title: `${senderName} membalas pesan Anda`,
      message: truncatedMessage,
      data: JSON.stringify({
        task_id: taskId,
        task_title: taskInfo.title,
        message_id: messageId,
        reply_to_message_id: replyToMessageId,
        sender_name: senderName,
        full_message: message
      }),
      is_read: false,
      is_active: true
    };
    
    const notification = await notificationRepository.createNotification(notificationData);
    
    console.log(`✅ Created reply notification`);
    
    // Broadcast via WebSocket if provided
    if (websocketBroadcast && typeof websocketBroadcast === 'function') {
      websocketBroadcast(originalMessage.user_id, {
        id: notification.id,
        type: 'reply',
        title: notification.title,
        message: notification.message,
        data: JSON.parse(notification.data),
        created_at: notification.created_at,
        is_read: false,
        sender: {
          id: senderId,
          name: senderName,
          email: senderInfo.email
        }
      });
    }
    
    return notification;
    
  } catch (error) {
    console.error('❌ Error creating reply notification:', error);
    throw error;
  }
}

module.exports = {
  createChatNotifications,
  createMentionNotifications,
  createReplyNotification
};

