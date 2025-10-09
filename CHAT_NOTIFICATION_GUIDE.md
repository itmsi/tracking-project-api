# 🔔 Panduan Notifikasi Chat

## 📌 Overview

Sistem chat pada aplikasi tracker dilengkapi dengan **sistem notifikasi otomatis** yang akan memberitahu semua member task ketika ada chat baru. Notifikasi ini bekerja baik melalui WebSocket (real-time) maupun tersimpan di database untuk diakses nanti.

---

## ✨ Fitur Notifikasi

### 1. ✅ Notifikasi Chat Baru
- **Trigger**: Ketika ada pesan baru di task
- **Penerima**: Semua member task **kecuali** pengirim pesan
- **Cara kerja**: 
  - Otomatis dibuat saat ada chat baru (via WebSocket atau HTTP)
  - Tersimpan di database (`notifications` table)
  - Dikirim real-time via WebSocket (jika user online)

### 2. ✅ Notifikasi Reply
- **Trigger**: Ketika seseorang membalas pesan Anda
- **Penerima**: Pemilik pesan yang dibalas
- **Prioritas**: Lebih tinggi dari notifikasi chat biasa

### 3. ✅ Notifikasi Mention (Coming Soon)
- **Trigger**: Ketika seseorang mention Anda dengan @username
- **Penerima**: User yang di-mention
- **Catatan**: Fitur ini sudah disiapkan, tinggal implementasi mention parser

---

## 🔧 Cara Kerja Sistem

### Flow Diagram

```
User A mengirim chat di Task X
         ↓
Pesan tersimpan ke database (task_chat)
         ↓
Sistem mengambil semua member Task X
         ↓
Filter out User A (pengirim)
         ↓
Buat notifikasi untuk setiap member lainnya
         ↓
Simpan notifikasi ke database (notifications)
         ↓
Jika user online → Kirim via WebSocket real-time
         ↓
User menerima notifikasi di aplikasi
```

### Komponen Sistem

1. **`src/utils/chat_notification.js`** - Utility untuk create notifications
2. **`src/modules/tasks/task_chat_socket.js`** - WebSocket handler dengan notifikasi
3. **`src/modules/tasks/task_view_handler.js`** - HTTP handler dengan notifikasi
4. **`src/modules/notifications/`** - Notification management module

---

## 📊 Struktur Data Notifikasi

### Database Schema (notifications table)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,           -- Penerima notifikasi
  sender_id UUID,                   -- Pengirim/pembuat notifikasi
  type VARCHAR(50) NOT NULL,        -- 'chat_message', 'reply', 'mention', dll
  title VARCHAR(255) NOT NULL,      -- Judul notifikasi
  message TEXT,                     -- Isi/preview notifikasi
  data JSON,                        -- Data tambahan
  is_read BOOLEAN DEFAULT false,    -- Status sudah dibaca
  read_at TIMESTAMP,                -- Waktu dibaca
  is_active BOOLEAN DEFAULT true,   -- Status aktif (untuk soft delete)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Contoh Data Notifikasi Chat

```json
{
  "id": "uuid",
  "user_id": "uuid-receiver",
  "sender_id": "uuid-sender",
  "type": "chat_message",
  "title": "Pesan baru dari John Doe",
  "message": "Halo, bagaimana progress task ini? Apakah sudah selesai?",
  "data": {
    "task_id": "uuid-task",
    "task_title": "Implementasi Chat Feature",
    "message_id": "uuid-message",
    "sender_name": "John Doe",
    "sender_email": "john@example.com",
    "full_message": "Halo, bagaimana progress task ini? Apakah sudah selesai?"
  },
  "is_read": false,
  "read_at": null,
  "created_at": "2025-01-09T10:00:00Z"
}
```

### Contoh Data Notifikasi Reply

```json
{
  "id": "uuid",
  "user_id": "uuid-original-sender",
  "sender_id": "uuid-replier",
  "type": "reply",
  "title": "Jane Smith membalas pesan Anda",
  "message": "Sudah 70% selesai, tinggal testing",
  "data": {
    "task_id": "uuid-task",
    "task_title": "Implementasi Chat Feature",
    "message_id": "uuid-new-message",
    "reply_to_message_id": "uuid-original-message",
    "sender_name": "Jane Smith",
    "full_message": "Sudah 70% selesai, tinggal testing"
  },
  "is_read": false,
  "read_at": null,
  "created_at": "2025-01-09T10:05:00Z"
}
```

---

## 🌐 API Endpoints untuk Notifikasi

### 1. GET - Ambil Daftar Notifikasi

```bash
GET /api/v1/notifications?page=1&limit=10&unread_only=true
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "status": true,
  "message": "Daftar notifikasi berhasil diambil",
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "chat_message",
        "title": "Pesan baru dari John Doe",
        "message": "Halo, bagaimana progress...",
        "data": {...},
        "is_read": false,
        "created_at": "2025-01-09T10:00:00Z",
        "sender_first_name": "John",
        "sender_last_name": "Doe"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 2. GET - Hitung Notifikasi Belum Dibaca

```bash
GET /api/v1/notifications/unread-count
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "status": true,
  "message": "Jumlah notifikasi belum dibaca",
  "data": {
    "unread_count": 5
  }
}
```

### 3. PATCH - Tandai Sebagai Dibaca

```bash
PATCH /api/v1/notifications/:notificationId/read
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "status": true,
  "message": "Notifikasi berhasil ditandai sebagai dibaca",
  "data": {
    "id": "uuid",
    "is_read": true,
    "read_at": "2025-01-09T10:10:00Z"
  }
}
```

### 4. PATCH - Tandai Semua Sebagai Dibaca

```bash
PATCH /api/v1/notifications/read-all
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "status": true,
  "message": "5 notifikasi berhasil ditandai sebagai dibaca"
}
```

### 5. DELETE - Hapus Notifikasi

```bash
DELETE /api/v1/notifications/:notificationId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📡 WebSocket Events untuk Notifikasi

### Connect & Subscribe

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:9554', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected');
  // User otomatis join personal notification room: user_{userId}
});
```

### Listen for Notifications

```javascript
// Event: notification
// Diterima ketika ada notifikasi baru untuk user ini
socket.on('notification', (notification) => {
  console.log('🔔 New notification:', notification);
  
  // notification structure:
  // {
  //   id: 'uuid',
  //   type: 'chat_message' | 'reply' | 'mention',
  //   title: 'Pesan baru dari John Doe',
  //   message: 'Preview message...',
  //   data: { task_id, task_title, message_id, ... },
  //   created_at: '2025-01-09T10:00:00Z',
  //   is_read: false,
  //   sender: {
  //     id: 'uuid',
  //     name: 'John Doe',
  //     email: 'john@example.com'
  //   }
  // }
  
  // Show notification to user
  showNotificationBanner(notification);
  updateUnreadCount();
});
```

---

## ⚛️ React Implementation

### Complete Notification Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const NotificationCenter = ({ token, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [socket, setSocket] = useState(null);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Setup WebSocket for real-time notifications
  useEffect(() => {
    const ws = io('http://localhost:9554', {
      auth: { token }
    });

    ws.on('connect', () => {
      console.log('✅ WebSocket connected for notifications');
    });

    // Listen for new notifications
    ws.on('notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to list
      setNotifications(prev => [notification, ...prev]);
      
      // Increment unread count
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification (if permitted)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png'
        });
      }
      
      // Play sound (optional)
      playNotificationSound();
    });

    setSocket(ws);

    return () => ws.close();
  }, [token]);

  const loadNotifications = async () => {
    try {
      const response = await axios.get(
        'http://localhost:9554/api/v1/notifications',
        {
          params: { page: 1, limit: 20, unread_only: false },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.status) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get(
        'http://localhost:9554/api/v1/notifications/unread-count',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.status) {
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:9554/api/v1/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        'http://localhost:9554/api/v1/notifications/read-all',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'chat_message' || notification.type === 'reply') {
      const taskId = notification.data.task_id;
      window.location.href = `/tasks/${taskId}?tab=chat`;
    }
    
    setShowDropdown(false);
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(e => console.log('Could not play sound:', e));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'chat_message': return '💬';
      case 'reply': return '↩️';
      case 'mention': return '@';
      default: return '🔔';
    }
  };

  return (
    <div className="notification-center">
      {/* Notification Bell Icon */}
      <button 
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="mark-all-btn">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  
                  <div className="notif-content">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-message">{notif.message}</div>
                    <div className="notif-time">
                      {new Date(notif.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>

                  {!notif.is_read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <button onClick={loadNotifications}>Lihat semua notifikasi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
```

### CSS Styles

```css
.notification-center {
  position: relative;
}

.notification-bell {
  position: relative;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
}

.notification-bell .badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #dc3545;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-height: 600px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 8px;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 18px;
}

.mark-all-btn {
  background: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 13px;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #e3f2fd;
}

.notif-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 14px;
}

.notif-message {
  color: #666;
  font-size: 13px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notif-time {
  color: #999;
  font-size: 11px;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background: #007bff;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.dropdown-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  text-align: center;
}

.dropdown-footer button {
  background: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
}
```

---

## 🧪 Testing Notifikasi

### 1. Test via WebSocket

```javascript
// Kirim chat yang akan trigger notifikasi
socket.emit('send_message', {
  taskId: 'uuid-task-id',
  message: 'Test notifikasi chat',
  attachments: []
});

// Semua member lain akan menerima:
// 1. Event 'new_message' - Chat baru
// 2. Event 'notification' - Notifikasi baru
```

### 2. Test via HTTP

```bash
# Kirim chat via HTTP
curl -X POST http://localhost:9554/api/v1/tasks/TASK_ID/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test notifikasi via HTTP",
    "attachments": []
  }'

# Cek notifikasi yang dibuat
curl -X GET http://localhost:9554/api/v1/notifications \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎯 Skenario Penggunaan

### Skenario 1: Chat Baru di Task

1. **User A** mengirim chat di Task X
2. Task X memiliki member: User B, User C, User D
3. Sistem creates 3 notifikasi (untuk B, C, D)
4. Jika B, C, D online → mereka langsung menerima via WebSocket
5. Jika offline → notifikasi tersimpan di database, bisa diakses nanti
6. Badge unread count di UI bertambah

### Skenario 2: Reply Message

1. **User A** mengirim chat di Task X
2. **User B** membalas chat User A
3. User A mendapat:
   - Notifikasi type `reply`
   - Prioritas lebih tinggi
   - Bisa langsung klik untuk lihat reply

### Skenario 3: Multiple Notifications

1. User menerima 5 notifikasi chat
2. Badge menunjukkan angka `5`
3. User klik "Tandai semua dibaca"
4. Semua notifikasi di-update, badge hilang
5. Notifikasi tetap bisa diakses di history

---

## ✅ Checklist Implementasi

- [x] Create notification utility (`chat_notification.js`)
- [x] Integrate dengan WebSocket handler
- [x] Integrate dengan HTTP handler
- [x] WebSocket broadcast personal notifications
- [x] Notification API endpoints (GET, PATCH, DELETE)
- [x] Database schema untuk notifications
- [x] Auto-create notifications untuk chat baru
- [x] Auto-create notifications untuk reply
- [ ] Auto-create notifications untuk mention (coming soon)
- [ ] Push notifications (browser/mobile)
- [ ] Email notifications (optional)

---

## 📚 File Terkait

```
src/
├── utils/
│   └── chat_notification.js        # Notification utility
│
├── modules/
│   ├── notifications/
│   │   ├── handler.js              # Notification HTTP handlers
│   │   ├── postgre_repository.js   # Notification DB operations
│   │   ├── index.js                # Notification routes
│   │   └── validation.js           # Validation schemas
│   │
│   └── tasks/
│       ├── task_chat_socket.js     # WebSocket dengan notifikasi
│       └── task_view_handler.js    # HTTP handler dengan notifikasi
│
└── repository/postgres/migrations/
    └── 20250101000010_create_notifications_table.js
```

---

## 🎉 Kesimpulan

**Sistem notifikasi chat SUDAH LENGKAP dan OTOMATIS!**

✅ **Setiap chat baru** → Semua member task langsung dapat notifikasi  
✅ **Reply message** → Pemilik pesan original dapat notifikasi khusus  
✅ **Real-time** → WebSocket mengirim notifikasi instant  
✅ **Persistent** → Notifikasi tersimpan di database  
✅ **Manageable** → User bisa mark as read, delete, dll  

**Tidak perlu konfigurasi tambahan!** Sistem sudah otomatis bekerja. 🚀

