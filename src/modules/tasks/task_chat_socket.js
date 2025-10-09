const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const taskChatRepository = require('./task_chat_repository');
const taskMembersRepository = require('./task_members_repository');
const { createActivityLog } = require('../../utils/activity_logger');

class TaskChatSocket {
  constructor(server) {
    console.log('🔌 Initializing WebSocket server...');
    
    this.io = new Server(server, {
      cors: {
        origin: function(origin, callback) {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          // Development environment - allow all origins
          if (process.env.NODE_ENV === 'development') {
            console.log('🌐 WebSocket CORS: Allowing origin:', origin);
            return callback(null, true);
          }
          
          // Get allowed origins from environment variables
          const allowedOrigins = process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
            ['http://localhost:3000', 'http://localhost:9554', 'http://localhost:3001'];
          
          if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('🌐 WebSocket CORS: Allowing origin:', origin);
            callback(null, true);
          } else {
            console.log('🚫 WebSocket CORS: Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ WebSocket server initialized successfully');
  }

  setupMiddleware() {
    // Authentication middleware untuk WebSocket
    this.io.use(async (socket, next) => {
      try {
        console.log('🔐 WebSocket authentication attempt');
        console.log('📋 Handshake auth:', socket.handshake.auth);
        console.log('📋 Handshake headers:', socket.handshake.headers);
        
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          console.log('❌ No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        console.log('🔑 Token received, verifying...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.user = decoded;
        
        console.log('✅ User authenticated:', decoded.id, decoded.email);
        next();
      } catch (error) {
        console.log('❌ Authentication failed:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 User ${socket.userId} connected to WebSocket`);
      console.log(`📊 Socket ID: ${socket.id}`);

      // Join task room
      socket.on('join_task', async (taskId) => {
        try {
          console.log(`🎯 User ${socket.userId} attempting to join task ${taskId}`);
          
          // Check if user has access to this task
          const hasAccess = await taskMembersRepository.checkUserPermission(taskId, socket.userId);
          console.log('🔍 Access check result:', hasAccess);
          
          if (!hasAccess.hasAccess) {
            console.log(`❌ User ${socket.userId} has no access to task ${taskId}`);
            socket.emit('error', { message: 'No access to this task' });
            return;
          }

          // Join task room
          socket.join(`task_${taskId}`);
          socket.currentTaskId = taskId;

          // Notify others that user joined
          socket.to(`task_${taskId}`).emit('user_joined', {
            userId: socket.userId,
            userName: `${socket.user.first_name} ${socket.user.last_name}`,
            timestamp: new Date().toISOString()
          });

          console.log(`✅ User ${socket.userId} successfully joined task ${taskId}`);
        } catch (error) {
          console.error('❌ Error joining task:', error);
          socket.emit('error', { message: 'Failed to join task', details: error.message });
        }
      });

      // Leave task room
      socket.on('leave_task', (taskId) => {
        console.log(`👋 User ${socket.userId} leaving task ${taskId}`);
        socket.leave(`task_${taskId}`);
        socket.currentTaskId = null;

        // Notify others that user left
        socket.to(`task_${taskId}`).emit('user_left', {
          userId: socket.userId,
          userName: `${socket.user.first_name} ${socket.user.last_name}`,
          timestamp: new Date().toISOString()
        });

        console.log(`✅ User ${socket.userId} left task ${taskId}`);
      });

      // Send message
      socket.on('send_message', async (data) => {
        try {
          console.log('💬 Send message request:', data);
          const { taskId, message, attachments = [], replyTo = null } = data;

          if (!taskId || !message) {
            socket.emit('error', { message: 'Task ID and message are required' });
            return;
          }

          // Check if user has access to this task
          const hasAccess = await taskMembersRepository.checkUserPermission(taskId, socket.userId);
          
          if (!hasAccess.hasAccess) {
            socket.emit('error', { message: 'No access to this task' });
            return;
          }

          // Check if user can comment
          if (hasAccess.permissions && !hasAccess.permissions.can_comment) {
            socket.emit('error', { message: 'No permission to send messages' });
            return;
          }

          // Create chat message
          const chatMessage = await taskChatRepository.createChatMessage(taskId, {
            message,
            attachments,
            reply_to: replyTo
          }, socket.userId);

          // Get full message data with user info
          const fullMessage = await taskChatRepository.getChatMessage(chatMessage.id);

          // Broadcast message to all users in the task room
          this.io.to(`task_${taskId}`).emit('new_message', {
            message: fullMessage,
            taskId
          });

          // Create activity log
          await createActivityLog({
            user_id: socket.userId,
            action: 'created',
            entity_type: 'task_chat',
            entity_id: chatMessage.id,
            new_values: chatMessage,
            description: `Chat message sent in task "${taskId}"`
          });

          console.log(`✅ Message sent in task ${taskId} by user ${socket.userId}`);
        } catch (error) {
          console.error('❌ Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message', details: error.message });
        }
      });

      // Edit message
      socket.on('edit_message', async (data) => {
        try {
          const { taskId, messageId, newMessage } = data;

          if (!taskId || !messageId || !newMessage) {
            socket.emit('error', { message: 'Task ID, message ID, and new message are required' });
            return;
          }

          // Check if user has access to this task
          const hasAccess = await taskMembersRepository.checkUserPermission(taskId, socket.userId);
          
          if (!hasAccess.hasAccess) {
            socket.emit('error', { message: 'No access to this task' });
            return;
          }

          // Update message (only message owner can edit)
          const updatedMessage = await taskChatRepository.updateChatMessage(messageId, {
            message: newMessage
          }, socket.userId);

          if (!updatedMessage) {
            socket.emit('error', { message: 'Message not found or no permission to edit' });
            return;
          }

          // Get full message data with user info
          const fullMessage = await taskChatRepository.getChatMessage(messageId);

          // Broadcast updated message to all users in the task room
          this.io.to(`task_${taskId}`).emit('message_edited', {
            message: fullMessage,
            taskId
          });

          console.log(`Message ${messageId} edited in task ${taskId} by user ${socket.userId}`);
        } catch (error) {
          console.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      // Delete message
      socket.on('delete_message', async (data) => {
        try {
          const { taskId, messageId } = data;

          if (!taskId || !messageId) {
            socket.emit('error', { message: 'Task ID and message ID are required' });
            return;
          }

          // Check if user has access to this task
          const hasAccess = await taskMembersRepository.checkUserPermission(taskId, socket.userId);
          
          if (!hasAccess.hasAccess) {
            socket.emit('error', { message: 'No access to this task' });
            return;
          }

          // Delete message (only message owner can delete)
          const deletedMessage = await taskChatRepository.deleteChatMessage(messageId, socket.userId);

          if (!deletedMessage) {
            socket.emit('error', { message: 'Message not found or no permission to delete' });
            return;
          }

          // Broadcast message deletion to all users in the task room
          this.io.to(`task_${taskId}`).emit('message_deleted', {
            messageId,
            taskId
          });

          console.log(`Message ${messageId} deleted in task ${taskId} by user ${socket.userId}`);
        } catch (error) {
          console.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      // Typing indicator
      socket.on('typing_start', (data) => {
        const { taskId } = data;
        if (taskId) {
          socket.to(`task_${taskId}`).emit('user_typing', {
            userId: socket.userId,
            userName: `${socket.user.first_name} ${socket.user.last_name}`
          });
        }
      });

      socket.on('typing_stop', (data) => {
        const { taskId } = data;
        if (taskId) {
          socket.to(`task_${taskId}`).emit('user_stopped_typing', {
            userId: socket.userId
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User ${socket.userId} disconnected: ${reason}`);
        if (socket.currentTaskId) {
          socket.to(`task_${socket.currentTaskId}`).emit('user_left', {
            userId: socket.userId,
            userName: `${socket.user.first_name} ${socket.user.last_name}`,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error('🚨 Socket error:', error);
      });
    });

    // Server-level error handling
    this.io.on('connection_error', (error) => {
      console.error('🚨 WebSocket connection error:', error);
    });
  }

  // Method untuk broadcast notifications
  broadcastTaskNotification(taskId, notification) {
    console.log(`📢 Broadcasting notification to task ${taskId}:`, notification);
    this.io.to(`task_${taskId}`).emit('task_notification', notification);
  }

  // Method untuk broadcast task updates
  broadcastTaskUpdate(taskId, update) {
    console.log(`🔄 Broadcasting task update to task ${taskId}:`, update);
    this.io.to(`task_${taskId}`).emit('task_updated', update);
  }

  // Method untuk broadcast member changes
  broadcastMemberChange(taskId, change) {
    console.log(`👥 Broadcasting member change to task ${taskId}:`, change);
    this.io.to(`task_${taskId}`).emit('member_changed', change);
  }
}

module.exports = TaskChatSocket;
