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
