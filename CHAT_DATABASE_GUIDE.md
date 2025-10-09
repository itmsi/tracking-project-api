# 💬 Panduan Riwayat Chat Database

## 📌 Overview

Sistem chat pada aplikasi tracker ini **OTOMATIS menyimpan semua riwayat chat ke database PostgreSQL** melalui tabel `task_chat`. Setiap pesan yang dikirim via WebSocket atau HTTP REST API akan tersimpan secara permanen di database.

---

## 🗄️ Struktur Database

### Tabel: `task_chat`

```sql
CREATE TABLE task_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments JSON NULL,
  reply_to UUID NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to) REFERENCES task_chat(id) ON DELETE SET NULL
);
```

**Keterangan Field:**
- `id` - ID unik pesan
- `task_id` - ID task tempat chat berlangsung
- `user_id` - ID user pengirim pesan
- `message` - Isi pesan teks
- `attachments` - File lampiran dalam format JSON array
- `reply_to` - ID pesan yang dibalas (untuk thread/reply)
- `is_edited` - Status apakah pesan sudah diedit
- `edited_at` - Waktu terakhir pesan diedit
- `is_deleted` - Status soft delete (pesan tidak benar-benar dihapus)
- `deleted_at` - Waktu pesan dihapus
- `created_at` - Waktu pesan dibuat
- `updated_at` - Waktu terakhir pesan diupdate

---

## 🚀 Cara Menggunakan

### 1. ✅ Pastikan Migration Sudah Dijalankan

```bash
# Jalankan migration untuk membuat tabel
npm run migrate

# Atau menggunakan knex langsung
npx knex migrate:latest --knexfile src/knexfile.js
```

Migration file: `src/repository/postgres/migrations/20250101000017_create_task_chat_table.js`

---

### 2. 📡 Menggunakan WebSocket (Real-time Chat)

#### A. Connect ke WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:9554', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  transports: ['websocket', 'polling']
});

// Cek koneksi
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});
```

#### B. Join Task Room

```javascript
const taskId = 'uuid-task-id';
socket.emit('join_task', taskId);
```

#### C. Kirim Pesan (OTOMATIS TERSIMPAN KE DB)

```javascript
socket.emit('send_message', {
  taskId: 'uuid-task-id',
  message: 'Halo, ini pesan dari websocket!',
  attachments: [
    {
      filename: 'document.pdf',
      url: 'https://storage.example.com/files/document.pdf',
      size: 1024000
    }
  ],
  replyTo: 'uuid-parent-message-id' // Optional
});
```

**✨ Pesan akan:**
1. ✅ Otomatis tersimpan ke tabel `task_chat`
2. ✅ Di-broadcast ke semua user di room task tersebut
3. ✅ Dicatat di activity log

#### D. Terima Pesan Baru

```javascript
socket.on('new_message', (data) => {
  console.log('📩 New message:', data.message);
  console.log('📍 Task ID:', data.taskId);
  
  // Data structure:
  // {
  //   message: {
  //     id: 'uuid',
  //     task_id: 'uuid',
  //     user_id: 'uuid',
  //     message: 'text',
  //     attachments: [...],
  //     created_at: '2025-01-01T00:00:00Z',
  //     first_name: 'John',
  //     last_name: 'Doe',
  //     email: 'john@example.com'
  //   },
  //   taskId: 'uuid'
  // }
});
```

#### E. Edit Pesan

```javascript
socket.emit('edit_message', {
  taskId: 'uuid-task-id',
  messageId: 'uuid-message-id',
  newMessage: 'Pesan yang sudah diedit'
});

// Terima notifikasi edit
socket.on('message_edited', (data) => {
  console.log('✏️ Message edited:', data.message);
});
```

#### F. Hapus Pesan

```javascript
socket.emit('delete_message', {
  taskId: 'uuid-task-id',
  messageId: 'uuid-message-id'
});

// Terima notifikasi hapus
socket.on('message_deleted', (data) => {
  console.log('🗑️ Message deleted:', data.messageId);
});
```

---

### 3. 🌐 Menggunakan HTTP REST API

#### A. GET - Ambil Riwayat Chat

```bash
GET /api/v1/tasks/:taskId/chat?limit=50&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "status": true,
  "message": "Chat messages berhasil diambil",
  "data": {
    "messages": [
      {
        "id": "uuid-message-1",
        "task_id": "uuid-task",
        "user_id": "uuid-user",
        "message": "Halo semua!",
        "attachments": null,
        "reply_to": null,
        "is_edited": false,
        "edited_at": null,
        "is_deleted": false,
        "deleted_at": null,
        "created_at": "2025-01-09T10:00:00Z",
        "updated_at": "2025-01-09T10:00:00Z",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      }
    ],
    "stats": {
      "total_messages": 150
    },
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 150
    }
  }
}
```

**Query Parameters:**
- `limit` - Jumlah pesan per halaman (default: 50)
- `offset` - Skip berapa pesan (untuk pagination)

#### B. POST - Kirim Pesan via HTTP

```bash
POST /api/v1/tasks/:taskId/chat
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Pesan melalui HTTP API",
  "attachments": [
    {
      "filename": "report.pdf",
      "url": "https://storage.example.com/report.pdf",
      "size": 2048000
    }
  ],
  "reply_to": "uuid-parent-message" // Optional
}
```

**Response:**
```json
{
  "status": true,
  "message": "Chat message berhasil dikirim",
  "data": {
    "id": "uuid-new-message",
    "task_id": "uuid-task",
    "user_id": "uuid-user",
    "message": "Pesan melalui HTTP API",
    "attachments": "[{...}]",
    "created_at": "2025-01-09T10:05:00Z"
  }
}
```

#### C. PUT - Edit Pesan

```bash
PUT /api/v1/tasks/:taskId/chat/:messageId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Pesan yang sudah diedit"
}
```

**Catatan:** Hanya pemilik pesan yang bisa mengedit.

#### D. DELETE - Hapus Pesan

```bash
DELETE /api/v1/tasks/:taskId/chat/:messageId
Authorization: Bearer YOUR_JWT_TOKEN
```

**Catatan:** 
- Soft delete (data tidak dihapus dari database)
- Hanya pemilik pesan yang bisa menghapus
- Field `is_deleted` akan menjadi `true`

---

## 🔍 Query Database Langsung

### Ambil Semua Pesan Task

```sql
SELECT 
  tc.*,
  u.first_name,
  u.last_name,
  u.email
FROM task_chat tc
LEFT JOIN users u ON tc.user_id = u.id
WHERE tc.task_id = 'uuid-task-id'
  AND tc.is_deleted = false
ORDER BY tc.created_at ASC;
```

### Ambil Pesan dengan Reply Thread

```sql
SELECT 
  tc.*,
  u.first_name as sender_name,
  reply_tc.message as reply_message,
  reply_user.first_name as reply_user_name
FROM task_chat tc
LEFT JOIN users u ON tc.user_id = u.id
LEFT JOIN task_chat reply_tc ON tc.reply_to = reply_tc.id
LEFT JOIN users reply_user ON reply_tc.user_id = reply_user.id
WHERE tc.task_id = 'uuid-task-id'
  AND tc.is_deleted = false
ORDER BY tc.created_at ASC;
```

### Statistik Chat per Task

```sql
SELECT 
  task_id,
  COUNT(*) as total_messages,
  COUNT(DISTINCT user_id) as total_participants,
  MAX(created_at) as last_message_at
FROM task_chat
WHERE is_deleted = false
GROUP BY task_id;
```

### Cari Pesan Berdasarkan Keyword

```sql
SELECT 
  tc.*,
  u.first_name,
  u.last_name
FROM task_chat tc
LEFT JOIN users u ON tc.user_id = u.id
WHERE tc.task_id = 'uuid-task-id'
  AND tc.is_deleted = false
  AND tc.message ILIKE '%keyword%'
ORDER BY tc.created_at DESC;
```

---

## 🎯 Contoh Penggunaan di Frontend (React)

### Komponen Chat dengan Auto-save ke Database

```jsx
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const TaskChat = ({ taskId, token }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Load riwayat chat dari database saat komponen mount
  useEffect(() => {
    loadChatHistory();
  }, [taskId]);

  // 2. Setup WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:9554', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected');
      newSocket.emit('join_task', taskId);
    });

    newSocket.on('new_message', (data) => {
      // Pesan baru otomatis sudah tersimpan di DB
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('message_edited', (data) => {
      setMessages(prev => 
        prev.map(msg => msg.id === data.message.id ? data.message : msg)
      );
    });

    newSocket.on('message_deleted', (data) => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== data.messageId)
      );
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [taskId, token]);

  // Load riwayat dari database
  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:9554/api/v1/tasks/${taskId}/chat?limit=100&offset=0`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessages(response.data.data.messages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kirim pesan (otomatis tersimpan ke DB)
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      taskId,
      message: newMessage,
      attachments: [],
      replyTo: null
    });

    setNewMessage('');
  };

  // Edit pesan
  const editMessage = (messageId, newText) => {
    socket.emit('edit_message', {
      taskId,
      messageId,
      newMessage: newText
    });
  };

  // Hapus pesan
  const deleteMessage = (messageId) => {
    socket.emit('delete_message', {
      taskId,
      messageId
    });
  };

  if (loading) {
    return <div>Loading chat history...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.first_name} {msg.last_name}</strong>
            <p>{msg.message}</p>
            <small>{new Date(msg.created_at).toLocaleString()}</small>
            {msg.is_edited && <span> (edited)</span>}
            
            <button onClick={() => editMessage(msg.id, 'New text')}>
              Edit
            </button>
            <button onClick={() => deleteMessage(msg.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default TaskChat;
```

---

## ⚙️ Konfigurasi

### Environment Variables

Pastikan file `.env` atau `environment` Anda memiliki:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracker_db
DB_USER=your_user
DB_PASS=your_password

# JWT
JWT_SECRET=your-secret-key

# WebSocket CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server
PORT=9554
NODE_ENV=development
```

---

## 🔒 Security & Permissions

### Akses Kontrol

1. **Authentication**: Semua endpoint dan WebSocket memerlukan JWT token
2. **Authorization**: User hanya bisa akses chat dari task yang mereka ikuti
3. **Ownership**: Hanya pemilik pesan yang bisa edit/delete pesan mereka
4. **Permissions**: Cek permission `can_comment` untuk membatasi user tertentu

### Validasi

Sebelum operasi apapun, sistem akan:
- ✅ Verifikasi JWT token
- ✅ Cek apakah user adalah member dari task
- ✅ Cek permission user (owner/admin/member)
- ✅ Untuk edit/delete: cek ownership pesan

---

## 📊 Monitoring & Logs

### Activity Logs

Setiap operasi chat dicatat di tabel `activity_logs`:

```sql
SELECT * FROM activity_logs 
WHERE entity_type = 'task_chat' 
ORDER BY created_at DESC;
```

### WebSocket Logs

Server akan menampilkan log untuk:
- ✅ User connect/disconnect
- ✅ Join/leave task room
- ✅ Send/edit/delete message
- ✅ Errors

---

## 🐛 Troubleshooting

### Pesan tidak tersimpan ke database

1. Cek apakah migration sudah dijalankan:
   ```bash
   npx knex migrate:status --knexfile src/knexfile.js
   ```

2. Cek log server untuk error database

3. Pastikan foreign key constraints terpenuhi (task_id dan user_id valid)

### WebSocket tidak connect

1. Pastikan token JWT valid
2. Cek CORS configuration di `src/modules/tasks/task_chat_socket.js`
3. Cek network firewall/proxy

### User tidak bisa kirim pesan

1. Pastikan user adalah member dari task:
   ```sql
   SELECT * FROM task_members WHERE task_id = 'xxx' AND user_id = 'yyy';
   ```

2. Cek permission `can_comment` di task_members table

---

## 📚 File-file Terkait

```
src/
├── modules/tasks/
│   ├── task_chat_socket.js         # WebSocket handler
│   ├── task_chat_repository.js     # Database operations
│   ├── task_view_handler.js        # HTTP REST API handlers
│   └── index.js                    # Routes definition
│
└── repository/postgres/migrations/
    └── 20250101000017_create_task_chat_table.js  # Database schema
```

---

## ✅ Kesimpulan

Sistem riwayat chat **SUDAH TERINTEGRASI PENUH** dengan database PostgreSQL:

- ✅ Setiap pesan via WebSocket **otomatis tersimpan**
- ✅ Bisa akses riwayat via HTTP REST API
- ✅ Support edit & delete (soft delete)
- ✅ Support reply/thread
- ✅ Support attachments
- ✅ Activity logging lengkap
- ✅ Permission & access control

**Tidak perlu konfigurasi tambahan!** Chat sudah otomatis tersimpan setiap kali user mengirim pesan. 🎉

---

## 📞 Support

Jika ada pertanyaan atau masalah, silakan hubungi tim development atau buat issue di repository.

