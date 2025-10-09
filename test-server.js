const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:9554', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());

// WebSocket Server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:9554', 'http://localhost:3000', 'http://localhost:3001'],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Mock API endpoints
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test server is running',
    timestamp: new Date().toISOString()
  });
});

// Mock notifications API
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({
    success: true,
    data: {
      unread_count: 5
    }
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        title: 'Test Notification',
        message: 'This is a test notification',
        read: false,
        created_at: new Date().toISOString()
      }
    ]
  });
});

// Mock task view API
app.get('/api/tasks/:id/view', (req, res) => {
  const taskId = req.params.id;
  res.json({
    success: true,
    data: {
      task: {
        id: taskId,
        title: 'Test Task',
        description: 'This is a test task',
        status: 'in_progress',
        priority: 'medium',
        created_at: new Date().toISOString()
      },
      details: {
        description: 'Detailed description',
        due_date: new Date().toISOString(),
        tags: ['test', 'mock']
      },
      members: [
        {
          id: '1',
          name: 'Test User',
          role: 'owner',
          avatar: null
        }
      ],
      attachments: [],
      chat: {
        messages: [],
        stats: {
          total_messages: 0
        }
      },
      permissions: {
        can_edit: true,
        can_comment: true,
        can_manage_members: true
      }
    }
  });
});

const PORT = 9553;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready at http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
});
