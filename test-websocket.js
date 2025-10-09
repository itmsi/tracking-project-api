// Test WebSocket Connection
const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:9553';
const TEST_TOKEN = 'your-valid-jwt-token-here'; // Ganti dengan token yang valid
const TEST_TASK_ID = 'test-task-id'; // Ganti dengan task ID yang valid

console.log('🧪 Starting WebSocket Test...');
console.log(`🔗 Connecting to: ${SERVER_URL}`);

const socket = io(SERVER_URL, {
  auth: {
    token: TEST_TOKEN
  },
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('📊 Socket ID:', socket.id);
  
  // Test join task after connection
  setTimeout(() => {
    console.log(`🎯 Attempting to join task: ${TEST_TASK_ID}`);
    socket.emit('join_task', TEST_TASK_ID);
  }, 1000);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('💡 Make sure:');
  console.log('   1. Backend server is running on port 9553');
  console.log('   2. JWT token is valid');
  console.log('   3. CORS is properly configured');
});

// Task events
socket.on('user_joined', (data) => {
  console.log('👋 User joined:', data);
  
  // Test send message after joining
  setTimeout(() => {
    console.log('💬 Sending test message...');
    socket.emit('send_message', {
      taskId: TEST_TASK_ID,
      message: 'Hello from WebSocket test!'
    });
  }, 2000);
});

socket.on('user_left', (data) => {
  console.log('👋 User left:', data);
});

// Message events
socket.on('new_message', (data) => {
  console.log('💬 New message received:', data);
});

socket.on('message_edited', (data) => {
  console.log('✏️ Message edited:', data);
});

socket.on('message_deleted', (data) => {
  console.log('🗑️ Message deleted:', data);
});

// Typing events
socket.on('user_typing', (data) => {
  console.log('⌨️ User typing:', data);
});

socket.on('user_stopped_typing', (data) => {
  console.log('⌨️ User stopped typing:', data);
});

// Task events
socket.on('task_notification', (notification) => {
  console.log('📢 Task notification:', notification);
});

socket.on('task_updated', (update) => {
  console.log('🔄 Task updated:', update);
});

socket.on('member_changed', (change) => {
  console.log('👥 Member changed:', change);
});

// Error handling
socket.on('error', (error) => {
  console.log('🚨 Socket error:', error);
});

// Test typing indicators
setTimeout(() => {
  console.log('⌨️ Testing typing indicators...');
  socket.emit('typing_start', { taskId: TEST_TASK_ID });
  
  setTimeout(() => {
    socket.emit('typing_stop', { taskId: TEST_TASK_ID });
  }, 3000);
}, 5000);

// Test leave task
setTimeout(() => {
  console.log('👋 Leaving task...');
  socket.emit('leave_task', TEST_TASK_ID);
}, 8000);

// Cleanup after test
setTimeout(() => {
  console.log('🧹 Cleaning up...');
  socket.disconnect();
  process.exit(0);
}, 10000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  socket.disconnect();
  process.exit(0);
});

console.log('⏱️ Test will run for 10 seconds...');
console.log('💡 Make sure to update TEST_TOKEN and TEST_TASK_ID with valid values');
