# 🚀 Quick Start - Chat Database

## ✅ Langkah Cepat Setup & Testing

### 1️⃣ Pastikan Migration Sudah Dijalankan

```bash
# Jalankan migration untuk membuat tabel task_chat
npm run migrate

# Atau menggunakan knex langsung
npx knex migrate:latest --knexfile src/knexfile.js

# Cek status migration
npx knex migrate:status --knexfile src/knexfile.js
```

**Output yang diharapkan:**
```
✅ 20250101000017_create_task_chat_table.js
```

---

### 2️⃣ Jalankan Server

```bash
# Development mode
npm run dev

# Atau production
npm start
```

Server akan berjalan di `http://localhost:9554` dengan:
- ✅ HTTP REST API
- ✅ WebSocket Server

---

### 3️⃣ Test Sistem Chat Database

#### Opsi A: Manual Test via Terminal

**1. Login dan dapatkan token:**
```bash
curl -X POST http://localhost:9554/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Simpan `token` dari response.

**2. Buat task:**
```bash
curl -X POST http://localhost:9554/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Chat Task",
    "description": "Task untuk testing chat",
    "status": "todo",
    "priority": "medium"
  }'
```

Simpan `id` task dari response.

**3. Kirim pesan chat:**
```bash
curl -X POST http://localhost:9554/api/v1/tasks/TASK_ID/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Halo, ini pesan test!",
    "attachments": []
  }'
```

**4. Ambil riwayat chat:**
```bash
curl -X GET "http://localhost:9554/api/v1/tasks/TASK_ID/chat?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ Jika berhasil, Anda akan melihat pesan yang baru dikirim!

---

#### Opsi B: Automated Test Script

Jalankan script test otomatis:

```bash
# Edit file test-chat-database.js
# Sesuaikan TEST_USER dengan kredensial user Anda
# Kemudian jalankan:

node test-chat-database.js
```

Script ini akan:
1. ✅ Login user
2. ✅ Buat task baru
3. ✅ Kirim pesan via HTTP REST API
4. ✅ Ambil riwayat chat dari database
5. ✅ Connect ke WebSocket
6. ✅ Kirim pesan via WebSocket
7. ✅ Verifikasi semua pesan tersimpan di database
8. ✅ Test edit pesan
9. ✅ Cleanup

**Output yang diharapkan:**
```
✅ Login berhasil!
✅ Task berhasil dibuat!
✅ Pesan berhasil dikirim via HTTP!
✅ Berhasil mengambil riwayat chat!
✅ WebSocket connected!
✅ Pesan berhasil dikirim dan di-broadcast!
✅ SEMUA PESAN TERSIMPAN DI DATABASE!
🎉 SEMUA TEST BERHASIL!
```

---

### 4️⃣ Verifikasi Database Langsung

Jika Anda ingin cek langsung di database PostgreSQL:

```bash
# Masuk ke PostgreSQL
psql -U your_user -d tracker_db

# Query untuk melihat semua pesan chat
SELECT 
  tc.id,
  tc.message,
  tc.created_at,
  u.first_name,
  u.last_name,
  t.title as task_title
FROM task_chat tc
LEFT JOIN users u ON tc.user_id = u.id
LEFT JOIN tasks t ON tc.task_id = t.id
WHERE tc.is_deleted = false
ORDER BY tc.created_at DESC
LIMIT 10;
```

---

## 📱 Integrasi di Frontend

### React Example (Quick)

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function Chat({ taskId, token }) {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Load history dari database
    fetch(`/api/v1/tasks/${taskId}/chat`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setMessages(data.data.messages));

    // Setup WebSocket
    const ws = io('http://localhost:9554', {
      auth: { token }
    });

    ws.on('connect', () => {
      ws.emit('join_task', taskId);
    });

    ws.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    setSocket(ws);
    return () => ws.close();
  }, [taskId, token]);

  const sendMessage = (text) => {
    socket.emit('send_message', {
      taskId,
      message: text,
      attachments: []
    });
  };

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>
          <strong>{msg.first_name}:</strong> {msg.message}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔍 Troubleshooting

### Migration Belum Dijalankan
**Error:** `relation "task_chat" does not exist`

**Solusi:**
```bash
npx knex migrate:latest --knexfile src/knexfile.js
```

---

### User Tidak Bisa Kirim Pesan
**Error:** `No access to this task`

**Solusi:**
Pastikan user adalah member dari task:
```sql
INSERT INTO task_members (task_id, user_id, role, permissions)
VALUES ('task-uuid', 'user-uuid', 'member', '{"can_comment": true}');
```

Atau tambahkan via API:
```bash
curl -X POST http://localhost:9554/api/v1/tasks/TASK_ID/members \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_UUID",
    "role": "member",
    "permissions": {"can_comment": true}
  }'
```

---

### WebSocket Tidak Connect
**Error:** `Authentication error`

**Solusi:**
1. Pastikan token JWT valid dan belum expired
2. Cek CORS configuration di `src/modules/tasks/task_chat_socket.js`
3. Pastikan origin frontend sudah ada di `CORS_ORIGINS` env variable

---

## 📚 Dokumentasi Lengkap

Untuk dokumentasi lengkap dan advanced usage, lihat:
- **[CHAT_DATABASE_GUIDE.md](./CHAT_DATABASE_GUIDE.md)** - Dokumentasi lengkap sistem chat

---

## ✅ Checklist

Pastikan semua ini sudah OK:

- [ ] Migration `20250101000017_create_task_chat_table.js` sudah dijalankan
- [ ] Tabel `task_chat` sudah ada di database
- [ ] Server sudah running di port 9554
- [ ] JWT_SECRET sudah di-set di environment
- [ ] User test sudah ada di database
- [ ] WebSocket CORS sudah dikonfigurasi

Jika semua checklist ✅, sistem chat database siap digunakan! 🎉

---

## 🎯 Kesimpulan

**Sistem chat SUDAH LENGKAP dan OTOMATIS menyimpan ke database!**

Setiap pesan yang dikirim (baik via WebSocket atau HTTP) akan:
1. ✅ Tersimpan ke tabel `task_chat`
2. ✅ Di-broadcast real-time ke semua user di task room
3. ✅ Bisa diambil kembali via HTTP API
4. ✅ Support edit & delete (soft delete)
5. ✅ Dicatat di activity logs

**Tidak perlu konfigurasi tambahan!** 🚀

