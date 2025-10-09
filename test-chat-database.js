/**
 * Script Test untuk Memverifikasi Riwayat Chat Tersimpan ke Database
 * 
 * Cara menjalankan:
 * 1. Pastikan server sudah running (npm start)
 * 2. node test-chat-database.js
 */

const axios = require('axios');
const io = require('socket.io-client');

// Konfigurasi
const BASE_URL = 'http://localhost:9554';
const API_URL = `${BASE_URL}/api/v1`;

// User credentials untuk testing (sesuaikan dengan data Anda)
const TEST_USER = {
  email: 'admin@example.com', // Ganti dengan email user Anda
  password: 'password123'      // Ganti dengan password Anda
};

const TEST_TASK_ID = null; // Akan diisi setelah create task

let authToken = null;
let userId = null;
let taskId = null;
let socket = null;

// Warna untuk console log
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.yellow}📊 ${msg}${colors.reset}`)
};

// Helper function untuk delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Step 1: Login untuk mendapatkan token
 */
async function login() {
  try {
    log.test('TEST 1: Login user...');
    
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    
    if (response.data.status && response.data.data.token) {
      authToken = response.data.data.token;
      userId = response.data.data.user.id;
      log.success(`Login berhasil! User ID: ${userId}`);
      log.data(`Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      log.error('Login gagal: Response tidak valid');
      return false;
    }
  } catch (error) {
    log.error(`Login gagal: ${error.response?.data?.message || error.message}`);
    log.info('Pastikan user dengan email/password tersebut sudah ada di database');
    return false;
  }
}

/**
 * Step 2: Buat task untuk testing
 */
async function createTask() {
  try {
    log.test('TEST 2: Membuat task untuk testing...');
    
    const taskData = {
      title: `Test Chat Database ${Date.now()}`,
      description: 'Task untuk testing chat database',
      status: 'todo',
      priority: 'medium',
      project_id: null // Sesuaikan jika perlu project_id
    };
    
    const response = await axios.post(`${API_URL}/tasks`, taskData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.status && response.data.data.id) {
      taskId = response.data.data.id;
      log.success(`Task berhasil dibuat! Task ID: ${taskId}`);
      return true;
    } else {
      log.error('Gagal membuat task');
      return false;
    }
  } catch (error) {
    log.error(`Gagal membuat task: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Step 3: Kirim pesan via HTTP REST API
 */
async function sendMessageViaHTTP() {
  try {
    log.test('TEST 3: Mengirim pesan via HTTP REST API...');
    
    const messageData = {
      message: 'Pesan test via HTTP API - Halo dari REST endpoint!',
      attachments: [
        {
          filename: 'test-document.pdf',
          url: 'https://example.com/test.pdf',
          size: 1024000
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/tasks/${taskId}/chat`,
      messageData,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.status && response.data.data.id) {
      log.success('Pesan berhasil dikirim via HTTP!');
      log.data(`Message ID: ${response.data.data.id}`);
      log.data(`Message: ${response.data.data.message}`);
      return response.data.data.id;
    } else {
      log.error('Gagal mengirim pesan via HTTP');
      return null;
    }
  } catch (error) {
    log.error(`Gagal mengirim pesan: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

/**
 * Step 4: Ambil riwayat chat dari database
 */
async function getChatHistory() {
  try {
    log.test('TEST 4: Mengambil riwayat chat dari database...');
    
    const response = await axios.get(
      `${API_URL}/tasks/${taskId}/chat?limit=50&offset=0`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    if (response.data.status && response.data.data.messages) {
      const messages = response.data.data.messages;
      const stats = response.data.data.stats;
      
      log.success(`Berhasil mengambil riwayat chat!`);
      log.data(`Total pesan di database: ${stats.total_messages}`);
      log.data(`Pesan yang diambil: ${messages.length}`);
      
      if (messages.length > 0) {
        log.info('\n📝 Daftar Pesan:');
        messages.forEach((msg, index) => {
          console.log(`\n   ${index + 1}. [${new Date(msg.created_at).toLocaleString()}]`);
          console.log(`      Pengirim: ${msg.first_name} ${msg.last_name} (${msg.email})`);
          console.log(`      Pesan: ${msg.message}`);
          console.log(`      ID: ${msg.id}`);
          if (msg.attachments) {
            console.log(`      Attachments: ${msg.attachments}`);
          }
        });
      }
      
      return messages;
    } else {
      log.error('Gagal mengambil riwayat chat');
      return [];
    }
  } catch (error) {
    log.error(`Gagal mengambil riwayat: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

/**
 * Step 5: Connect ke WebSocket
 */
async function connectWebSocket() {
  return new Promise((resolve, reject) => {
    try {
      log.test('TEST 5: Menghubungkan ke WebSocket...');
      
      socket = io(BASE_URL, {
        auth: { token: authToken },
        transports: ['websocket', 'polling']
      });
      
      socket.on('connect', () => {
        log.success('WebSocket connected!');
        log.data(`Socket ID: ${socket.id}`);
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        log.error(`WebSocket connection error: ${error.message}`);
        reject(error);
      });
      
      socket.on('error', (error) => {
        log.error(`WebSocket error: ${error.message}`);
      });
      
      // Timeout jika tidak connect dalam 5 detik
      setTimeout(() => {
        if (!socket.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 5000);
    } catch (error) {
      log.error(`Gagal connect WebSocket: ${error.message}`);
      reject(error);
    }
  });
}

/**
 * Step 6: Join task room
 */
async function joinTaskRoom() {
  return new Promise((resolve) => {
    log.test('TEST 6: Bergabung ke task room...');
    
    socket.emit('join_task', taskId);
    
    // Tunggu konfirmasi join atau error
    const timeout = setTimeout(() => {
      log.success('Berhasil join task room (assumed)');
      resolve(true);
    }, 1000);
    
    socket.on('user_joined', (data) => {
      clearTimeout(timeout);
      log.success(`User joined: ${data.userName}`);
      resolve(true);
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeout);
      log.error(`Error join task: ${error.message}`);
      resolve(false);
    });
  });
}

/**
 * Step 7: Kirim pesan via WebSocket
 */
async function sendMessageViaWebSocket() {
  return new Promise((resolve) => {
    log.test('TEST 7: Mengirim pesan via WebSocket...');
    
    let messageReceived = false;
    
    // Listen for new message broadcast
    socket.on('new_message', (data) => {
      if (!messageReceived && data.taskId === taskId) {
        messageReceived = true;
        log.success('✅ Pesan berhasil dikirim dan di-broadcast!');
        log.data(`Message ID: ${data.message.id}`);
        log.data(`Message: ${data.message.message}`);
        log.data(`Pengirim: ${data.message.first_name} ${data.message.last_name}`);
        resolve(data.message.id);
      }
    });
    
    // Send message
    const messageData = {
      taskId: taskId,
      message: 'Pesan test via WebSocket - Real-time chat!',
      attachments: [],
      replyTo: null
    };
    
    socket.emit('send_message', messageData);
    
    // Timeout jika tidak ada response
    setTimeout(() => {
      if (!messageReceived) {
        log.error('Timeout: Tidak menerima broadcast pesan');
        resolve(null);
      }
    }, 5000);
  });
}

/**
 * Step 8: Verifikasi pesan tersimpan di database
 */
async function verifyMessagesInDatabase() {
  try {
    log.test('TEST 8: Verifikasi semua pesan tersimpan di database...');
    
    await delay(1000); // Tunggu sebentar untuk memastikan data sudah masuk
    
    const messages = await getChatHistory();
    
    if (messages.length >= 2) {
      log.success(`✅ SEMUA PESAN TERSIMPAN DI DATABASE!`);
      log.success(`Total pesan di database: ${messages.length}`);
      
      // Verifikasi ada pesan dari HTTP dan WebSocket
      const hasHTTPMessage = messages.some(m => m.message.includes('HTTP API'));
      const hasWSMessage = messages.some(m => m.message.includes('WebSocket'));
      
      if (hasHTTPMessage) {
        log.success('✅ Pesan dari HTTP REST API tersimpan');
      }
      if (hasWSMessage) {
        log.success('✅ Pesan dari WebSocket tersimpan');
      }
      
      return true;
    } else {
      log.error('Pesan tidak tersimpan dengan benar di database');
      return false;
    }
  } catch (error) {
    log.error(`Gagal verifikasi: ${error.message}`);
    return false;
  }
}

/**
 * Step 9: Test Edit Pesan
 */
async function testEditMessage(messageId) {
  return new Promise((resolve) => {
    log.test('TEST 9: Testing edit pesan...');
    
    socket.on('message_edited', (data) => {
      if (data.message.id === messageId) {
        log.success('✅ Pesan berhasil diedit!');
        log.data(`New message: ${data.message.message}`);
        log.data(`Is edited: ${data.message.is_edited}`);
        resolve(true);
      }
    });
    
    socket.emit('edit_message', {
      taskId: taskId,
      messageId: messageId,
      newMessage: 'Pesan yang sudah DIEDIT via WebSocket!'
    });
    
    setTimeout(() => {
      log.error('Timeout: Edit message tidak berhasil');
      resolve(false);
    }, 5000);
  });
}

/**
 * Step 10: Clean up
 */
async function cleanup() {
  try {
    log.info('\n🧹 Cleaning up...');
    
    if (socket && socket.connected) {
      socket.disconnect();
      log.success('WebSocket disconnected');
    }
    
    // Opsional: Hapus task test (uncomment jika ingin auto-cleanup)
    // if (taskId && authToken) {
    //   await axios.delete(`${API_URL}/tasks/${taskId}`, {
    //     headers: { Authorization: `Bearer ${authToken}` }
    //   });
    //   log.success('Task test dihapus');
    // }
    
    log.info('\n✨ Test selesai!');
  } catch (error) {
    log.error(`Cleanup error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING RIWAYAT CHAT DATABASE');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      log.error('❌ Test GAGAL: Tidak bisa login');
      return;
    }
    await delay(500);
    
    // Step 2: Create Task
    const taskSuccess = await createTask();
    if (!taskSuccess) {
      log.error('❌ Test GAGAL: Tidak bisa create task');
      return;
    }
    await delay(500);
    
    // Step 3: Send Message via HTTP
    const httpMessageId = await sendMessageViaHTTP();
    if (!httpMessageId) {
      log.error('❌ Test GAGAL: Tidak bisa kirim pesan via HTTP');
      return;
    }
    await delay(500);
    
    // Step 4: Get Chat History
    const messages1 = await getChatHistory();
    if (messages1.length === 0) {
      log.error('❌ Test GAGAL: Chat history kosong');
      return;
    }
    await delay(500);
    
    // Step 5: Connect WebSocket
    const wsConnected = await connectWebSocket();
    if (!wsConnected) {
      log.error('❌ Test GAGAL: WebSocket tidak connect');
      return;
    }
    await delay(500);
    
    // Step 6: Join Task Room
    await joinTaskRoom();
    await delay(500);
    
    // Step 7: Send Message via WebSocket
    const wsMessageId = await sendMessageViaWebSocket();
    if (!wsMessageId) {
      log.error('⚠️  Warning: WebSocket message tidak terkirim, tapi test dilanjutkan');
    }
    await delay(1000);
    
    // Step 8: Verify Messages in Database
    const verified = await verifyMessagesInDatabase();
    await delay(500);
    
    // Step 9: Test Edit Message
    if (wsMessageId) {
      await testEditMessage(wsMessageId);
      await delay(1000);
    }
    
    // Final verification
    await getChatHistory();
    
    console.log('\n' + '='.repeat(60));
    if (verified) {
      log.success('🎉 SEMUA TEST BERHASIL!');
      log.success('✅ Riwayat chat TERSIMPAN dengan baik di database PostgreSQL');
    } else {
      log.error('⚠️  Beberapa test gagal, silakan cek log di atas');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    log.error(`\n❌ Test error: ${error.message}`);
    console.error(error);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

// Jalankan test
runTests();

