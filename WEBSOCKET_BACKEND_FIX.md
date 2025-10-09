# 🔧 WebSocket Backend Fix - Solusi Masalah WebSocket

## 🚨 Masalah yang Ditemukan

Berdasarkan analisis error dan kode yang ada, berikut adalah masalah-masalah yang ditemukan:

### 1. **Port Mismatch**
- **Backend berjalan di**: `port 9553` (dari .env)
- **Frontend mencoba koneksi ke**: `port 9553` (benar)
- **Dokumentasi menyebutkan**: `port 9509/9513` (salah)

### 2. **CORS Configuration**
- WebSocket CORS mungkin tidak sesuai dengan frontend URL
- Perlu konfigurasi yang tepat untuk development

### 3. **Error Handling**
- Error "Failed to join task" menunjukkan masalah di backend
- Perlu debugging lebih lanjut

## ✅ Solusi yang Diimplementasikan

### 1. **Perbaikan Konfigurasi WebSocket**

#### Update TaskChatSocket untuk Debugging
```javascript
// src/modules/tasks/task_chat_socket.js - Perbaikan
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
            ['http://localhost:3000', 'http://localhost:3001'];
          
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
```

### 2. **Perbaikan Server.js**

```javascript
// src/server.js - Perbaikan
// make sure for crashing handler continues to run
const app = require('./app')
const http = require('http')
const TaskChatSocket = require('./modules/tasks/task_chat_socket')

process.on('warning', (warning) => {
  console.warn(warning.name)
  console.warn(warning.message)
  console.warn(warning.stack)
})

const unhandledRejections = new Map()
process.on('unhandledRejection', (reason, promise) => {
  unhandledRejections.set(promise, reason)
  console.log(
    process.stderr.fd,
    `Caught rejection: ${promise}\n`
    + `Exception reason: ${reason}`
  )
})
process.on('rejectionHandled', (promise) => {
  unhandledRejections.delete(promise)
})

process.on('uncaughtException', (err, origin) => {
  console.log(
    process.stderr.fd,
    `Caught exception: ${err}\n`
    + `Exception origin: ${origin}`
  )
})

process.on('SIGTERM', () => {
  console.info('SIGTERM received')
})

// Create HTTP server
const server = http.createServer(app)

// Initialize WebSocket for task chat
console.log('🚀 Starting WebSocket server...');
let taskChatSocket;
try {
  taskChatSocket = new TaskChatSocket(server);
  console.log('✅ WebSocket server initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
  process.exit(1);
}

// Make socket instance available globally
app.set('taskChatSocket', taskChatSocket)

const PORT = process.env.APP_PORT || 9553;
server.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`🚀 ${process?.env.APP_NAME} running in port ${PORT}`)
    console.info('🔌 WebSocket server initialized for task chat')
    console.info(`🌐 Server URL: http://localhost:${PORT}`)
    console.info(`🔌 WebSocket URL: ws://localhost:${PORT}`)
  } else {
    console.info(`${process?.env.APP_NAME} is running`)
    console.info('🔌 WebSocket server initialized for task chat')
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
```

### 3. **Update Environment Configuration**

```bash
# .env - Pastikan konfigurasi ini benar
APP_NAME=API Boilerplate
APP_PORT=9553
NODE_ENV=development
HOST=localhost
APP_BASE_URL=http://localhost:9553

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:9551,http://localhost:9552,http://localhost:9553,http://localhost:9554
CORS_CREDENTIALS=true
CORS_METHODS=GET,POST,PUT,DELETE,PATCH,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Requested-With,Accept,Origin

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL for WebSocket CORS
FRONTEND_URL=http://localhost:3000
```

### 4. **Test WebSocket Connection**

#### Test Script untuk Backend
```javascript
// test-websocket.js
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Generate test token (gunakan token yang valid dari login)
const testToken = 'your-valid-jwt-token-here';

const socket = io('http://localhost:9553', {
  auth: {
    token: testToken
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Test join task
  socket.emit('join_task', 'test-task-id');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error);
});

socket.on('error', (error) => {
  console.log('❌ Socket error:', error);
});

socket.on('user_joined', (data) => {
  console.log('👋 User joined:', data);
});

// Test send message
setTimeout(() => {
  socket.emit('send_message', {
    taskId: 'test-task-id',
    message: 'Hello from test client!'
  });
}, 2000);

socket.on('new_message', (data) => {
  console.log('💬 New message:', data);
});
```

## 🧪 Testing Steps

### 1. **Restart Backend Server**
```bash
cd /Users/falaqmsi/Documents/GitHub/tracker-project
npm run dev
```

### 2. **Check Server Logs**
Pastikan melihat log:
```
🚀 Starting WebSocket server...
✅ WebSocket server initialized successfully
🚀 API Boilerplate running in port 9553
🔌 WebSocket server initialized for task chat
🌐 Server URL: http://localhost:9553
🔌 WebSocket URL: ws://localhost:9553
```

### 3. **Test WebSocket Connection**
```bash
# Install socket.io-client untuk testing
npm install socket.io-client

# Run test script
node test-websocket.js
```

### 4. **Frontend Configuration**
Pastikan frontend menggunakan URL yang benar:
```javascript
// Frontend WebSocket connection
const socket = io('http://localhost:9553', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});
```

## 🔍 Debugging Commands

### 1. **Check if Server is Running**
```bash
curl http://localhost:9553/health
```

### 2. **Check WebSocket Endpoint**
```bash
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:9553/socket.io/
```

### 3. **Check Database Connection**
```bash
# Pastikan database berjalan dan tabel task_chat ada
psql -h localhost -U postgres -d your_database -c "\dt task_chat"
```

## 📋 Checklist Perbaikan

- [x] **Port Configuration** - Backend berjalan di port 9553
- [x] **WebSocket CORS** - Konfigurasi CORS yang tepat
- [x] **Authentication** - JWT token validation
- [x] **Error Handling** - Proper error messages dan logging
- [x] **Database Integration** - Repository methods untuk chat
- [x] **Event Handlers** - Semua WebSocket events
- [ ] **Frontend Integration** - Test dengan React frontend
- [ ] **Production Ready** - Environment variables untuk production

## 🎯 Expected Results

Setelah perbaikan ini, Anda seharusnya melihat:

1. **✅ WebSocket Connection Success**
   ```
   🔗 User 1 connected to WebSocket
   📊 Socket ID: abc123
   ```

2. **✅ Task Join Success**
   ```
   🎯 User 1 attempting to join task task-123
   🔍 Access check result: { hasAccess: true, role: 'owner' }
   ✅ User 1 successfully joined task task-123
   ```

3. **✅ Message Send Success**
   ```
   💬 Send message request: { taskId: 'task-123', message: 'Hello!' }
   ✅ Message sent in task task-123 by user 1
   ```

## 🚀 Next Steps

1. **Restart backend server** dengan kode yang sudah diperbaiki
2. **Test WebSocket connection** menggunakan test script
3. **Update frontend** untuk menggunakan port 9553
4. **Test full integration** antara frontend dan backend
5. **Monitor logs** untuk memastikan tidak ada error

Dengan perbaikan ini, masalah WebSocket seharusnya sudah teratasi! 🎉
