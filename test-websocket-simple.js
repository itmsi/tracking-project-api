// Simple WebSocket Test - No Authentication
const io = require('socket.io-client');

console.log('🧪 Starting Simple WebSocket Test...');
console.log('🔗 Connecting to: http://localhost:9553');

const socket = io('http://localhost:9553', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('📊 Socket ID:', socket.id);
  
  // Test basic connection
  console.log('🎯 Testing basic WebSocket connection...');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('💡 Make sure:');
  console.log('   1. Backend server is running on port 9553');
  console.log('   2. WebSocket server is properly initialized');
  console.log('   3. CORS is properly configured');
});

// Error handling
socket.on('error', (error) => {
  console.log('🚨 Socket error:', error);
});

// Test after 2 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up...');
  socket.disconnect();
  process.exit(0);
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  socket.disconnect();
  process.exit(0);
});

console.log('⏱️ Test will run for 5 seconds...');
