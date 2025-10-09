# 💬 Contoh Penggunaan API Chat

## 📥 Mendapatkan Chat Messages by Task ID

### cURL Example

```bash
# Ambil 50 pesan terakhir dari task
curl -X GET "http://localhost:9554/api/v1/tasks/YOUR_TASK_ID/chat?limit=50&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response Success (200)

```json
{
  "status": true,
  "message": "Chat messages berhasil diambil",
  "data": {
    "messages": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440099",
        "message": "Halo, bagaimana progress task ini?",
        "attachments": null,
        "reply_to": null,
        "is_edited": false,
        "edited_at": null,
        "is_deleted": false,
        "deleted_at": null,
        "created_at": "2025-01-09T10:00:00.000Z",
        "updated_at": "2025-01-09T10:00:00.000Z",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "reply_first_name": null,
        "reply_last_name": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": "550e8400-e29b-41d4-a716-446655440098",
        "message": "Sudah 70% selesai, tinggal testing",
        "attachments": "[{\"filename\":\"screenshot.png\",\"url\":\"https://example.com/files/screenshot.png\",\"size\":512000}]",
        "reply_to": "550e8400-e29b-41d4-a716-446655440001",
        "is_edited": false,
        "edited_at": null,
        "is_deleted": false,
        "deleted_at": null,
        "created_at": "2025-01-09T10:05:00.000Z",
        "updated_at": "2025-01-09T10:05:00.000Z",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "reply_first_name": "John",
        "reply_last_name": "Doe"
      }
    ],
    "stats": {
      "total_messages": 25
    },
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 25
    }
  }
}
```

### Response Error - No Access (403)

```json
{
  "status": false,
  "message": "Tidak memiliki akses untuk melihat chat task ini"
}
```

---

## 🌐 JavaScript/Axios Example

### Menggunakan Axios

```javascript
import axios from 'axios';

const getTaskChat = async (taskId, token) => {
  try {
    const response = await axios.get(
      `http://localhost:9554/api/v1/tasks/${taskId}/chat`,
      {
        params: {
          limit: 50,
          offset: 0
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (response.data.status) {
      const { messages, stats, pagination } = response.data.data;
      
      console.log(`Total pesan: ${stats.total_messages}`);
      console.log(`Pesan yang dimuat: ${messages.length}`);
      
      return messages;
    }
  } catch (error) {
    console.error('Error fetching chat:', error.response?.data || error.message);
    return [];
  }
};

// Penggunaan
const taskId = '550e8400-e29b-41d4-a716-446655440000';
const token = 'your-jwt-token-here';

getTaskChat(taskId, token).then(messages => {
  messages.forEach(msg => {
    console.log(`[${msg.first_name}]: ${msg.message}`);
  });
});
```

### Menggunakan Fetch API

```javascript
const getTaskChat = async (taskId, token) => {
  const response = await fetch(
    `http://localhost:9554/api/v1/tasks/${taskId}/chat?limit=50&offset=0`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  if (data.status) {
    return data.data.messages;
  }
  
  throw new Error(data.message);
};
```

---

## ⚛️ React Component Example

### Simple Chat Display Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskChatDisplay = ({ taskId, token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  
  // Load chat messages saat component mount atau taskId berubah
  useEffect(() => {
    loadChatMessages();
  }, [taskId]);
  
  const loadChatMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `http://localhost:9554/api/v1/tasks/${taskId}/chat`,
        {
          params: { limit: 100, offset: 0 },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.status) {
        setMessages(response.data.data.messages);
        setStats(response.data.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat chat');
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Parse attachments jika ada
  const parseAttachments = (attachmentsJson) => {
    if (!attachmentsJson) return [];
    try {
      return JSON.parse(attachmentsJson);
    } catch (e) {
      return [];
    }
  };
  
  if (loading) {
    return <div className="loading">Loading chat messages...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div className="task-chat">
      <div className="chat-header">
        <h3>Chat Messages</h3>
        <span className="message-count">
          {stats?.total_messages || 0} messages
        </span>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">Belum ada pesan</div>
        ) : (
          messages.map((msg) => {
            const attachments = parseAttachments(msg.attachments);
            
            return (
              <div key={msg.id} className="message-item">
                <div className="message-header">
                  <strong className="sender-name">
                    {msg.first_name} {msg.last_name}
                  </strong>
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleString('id-ID')}
                  </span>
                  {msg.is_edited && (
                    <span className="edited-badge">(edited)</span>
                  )}
                </div>
                
                {msg.reply_to && msg.reply_first_name && (
                  <div className="reply-info">
                    Membalas pesan dari {msg.reply_first_name} {msg.reply_last_name}
                  </div>
                )}
                
                <div className="message-content">
                  {msg.message}
                </div>
                
                {attachments.length > 0 && (
                  <div className="message-attachments">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="attachment-item">
                        📎 <a href={file.url} target="_blank" rel="noopener noreferrer">
                          {file.filename}
                        </a>
                        <span className="file-size">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <button onClick={loadChatMessages} className="refresh-button">
        🔄 Refresh Chat
      </button>
    </div>
  );
};

export default TaskChatDisplay;
```

### Usage in Parent Component

```jsx
import TaskChatDisplay from './TaskChatDisplay';

function TaskDetailPage() {
  const taskId = 'uuid-from-url-or-props';
  const token = localStorage.getItem('authToken'); // or from context/redux
  
  return (
    <div className="task-detail">
      <h1>Task Details</h1>
      
      {/* Task info sections */}
      
      <TaskChatDisplay taskId={taskId} token={token} />
    </div>
  );
}
```

---

## 🎨 CSS Example untuk Chat Display

```css
.task-chat {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
}

.message-count {
  background: #007bff;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.chat-messages {
  max-height: 600px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.message-item {
  background: #f8f9fa;
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 3px solid #007bff;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sender-name {
  color: #333;
  font-weight: 600;
}

.message-time {
  color: #666;
  font-size: 12px;
}

.edited-badge {
  color: #999;
  font-size: 11px;
  font-style: italic;
}

.reply-info {
  background: #e3f2fd;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #1976d2;
}

.message-content {
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-attachments {
  margin-top: 10px;
}

.attachment-item {
  background: white;
  padding: 8px 12px;
  margin-top: 6px;
  border-radius: 4px;
  border: 1px solid #ddd;
  font-size: 13px;
}

.attachment-item a {
  color: #007bff;
  text-decoration: none;
  margin-left: 4px;
}

.attachment-item a:hover {
  text-decoration: underline;
}

.file-size {
  color: #999;
  margin-left: 8px;
  font-size: 11px;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.loading, .error {
  text-align: center;
  padding: 40px 20px;
}

.error {
  color: #dc3545;
}

.refresh-button {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
}

.refresh-button:hover {
  background: #218838;
}
```

---

## 📱 Advanced React Component dengan Pagination

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const TaskChatWithPagination = ({ taskId, token }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const MESSAGES_PER_PAGE = 20;
  
  const loadMessages = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `http://localhost:9554/api/v1/tasks/${taskId}/chat`,
        {
          params: {
            limit: MESSAGES_PER_PAGE,
            offset: pageNum * MESSAGES_PER_PAGE
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.status) {
        const newMessages = response.data.data.messages;
        
        if (append) {
          setMessages(prev => [...prev, ...newMessages]);
        } else {
          setMessages(newMessages);
        }
        
        setStats(response.data.data.stats);
        setHasMore(newMessages.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);
  
  useEffect(() => {
    loadMessages(0, false);
  }, [loadMessages]);
  
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMessages(nextPage, true);
  };
  
  return (
    <div className="task-chat-paginated">
      <div className="chat-header">
        <h3>Chat Messages</h3>
        <span>{stats?.total_messages || 0} total messages</span>
      </div>
      
      <div className="messages-list">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.first_name} {msg.last_name}</strong>
            <p>{msg.message}</p>
            <small>{new Date(msg.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      
      {hasMore && !loading && (
        <button onClick={loadMore} className="load-more-btn">
          Load More Messages
        </button>
      )}
      
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
};

export default TaskChatWithPagination;
```

---

## 🔄 Integration dengan WebSocket untuk Real-time Updates

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const TaskChatRealtime = ({ taskId, token }) => {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  
  // Load initial chat history dari database
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:9554/api/v1/tasks/${taskId}/chat`,
          {
            params: { limit: 100, offset: 0 },
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.status) {
          setMessages(response.data.data.messages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    
    loadHistory();
  }, [taskId, token]);
  
  // Setup WebSocket untuk real-time updates
  useEffect(() => {
    const ws = io('http://localhost:9554', {
      auth: { token }
    });
    
    ws.on('connect', () => {
      console.log('Connected to WebSocket');
      ws.emit('join_task', taskId);
    });
    
    ws.on('new_message', (data) => {
      if (data.taskId === taskId) {
        // Tambahkan pesan baru ke list (sudah tersimpan di database otomatis)
        setMessages(prev => [...prev, data.message]);
      }
    });
    
    ws.on('message_edited', (data) => {
      if (data.taskId === taskId) {
        setMessages(prev =>
          prev.map(msg => msg.id === data.message.id ? data.message : msg)
        );
      }
    });
    
    ws.on('message_deleted', (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    });
    
    setSocket(ws);
    
    return () => {
      ws.emit('leave_task', taskId);
      ws.close();
    };
  }, [taskId, token]);
  
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    
    socket.emit('send_message', {
      taskId,
      message: newMessage,
      attachments: []
    });
    
    setNewMessage('');
  };
  
  return (
    <div className="chat-realtime">
      <h3>Chat (Real-time)</h3>
      
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.first_name}:</strong> {msg.message}
            <br />
            <small>{new Date(msg.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      
      <div className="input-area">
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

export default TaskChatRealtime;
```

---

## 🎯 Summary

### ✅ API Endpoint Tersedia:

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET | `/api/v1/tasks/:taskId/chat` | **Ambil semua chat messages dari task** |
| POST | `/api/v1/tasks/:taskId/chat` | Kirim pesan baru via HTTP |
| PUT | `/api/v1/tasks/:taskId/chat/:messageId` | Edit pesan |
| DELETE | `/api/v1/tasks/:taskId/chat/:messageId` | Hapus pesan |

### 📊 Response Data Structure:

```javascript
{
  messages: [
    {
      id, task_id, user_id, message, attachments,
      reply_to, is_edited, edited_at,
      created_at, updated_at,
      first_name, last_name, email,
      reply_first_name, reply_last_name
    }
  ],
  stats: { total_messages },
  pagination: { limit, offset, total }
}
```

### 🚀 Cara Pakai:

1. **HTTP Request** - Untuk load riwayat chat saat pertama buka task
2. **WebSocket** - Untuk real-time updates pesan baru

**Kedua metode otomatis menyimpan ke database PostgreSQL!** ✅

