# 🔌 WebSocket Chat Integration Guide

## 📋 **Overview**

Dokumentasi ini menjelaskan cara mengintegrasikan **WebSocket** untuk real-time chat dalam Task View. WebSocket memungkinkan:

- ✅ **Real-time Messaging** - Pesan langsung muncul tanpa refresh
- ✅ **Typing Indicators** - Melihat siapa yang sedang mengetik
- ✅ **User Presence** - Melihat siapa yang online di task
- ✅ **Instant Updates** - Edit/delete message langsung terlihat
- ✅ **Better UX** - Experience seperti WhatsApp/Telegram

## 🚀 **Backend Implementation**

### **WebSocket Server Features:**
- ✅ **Authentication** - JWT token validation
- ✅ **Room Management** - Join/leave task rooms
- ✅ **Permission Checking** - Role-based access control
- ✅ **Real-time Events** - Send, edit, delete messages
- ✅ **Typing Indicators** - User typing status
- ✅ **User Presence** - Online/offline status

### **WebSocket Events:**

#### **Client → Server:**
```javascript
// Join task room
socket.emit('join_task', taskId)

// Leave task room  
socket.emit('leave_task', taskId)

// Send message
socket.emit('send_message', {
  taskId: 'task-id',
  message: 'Hello world!',
  attachments: [],
  replyTo: null
})

// Edit message
socket.emit('edit_message', {
  taskId: 'task-id',
  messageId: 'message-id',
  newMessage: 'Updated message'
})

// Delete message
socket.emit('delete_message', {
  taskId: 'task-id',
  messageId: 'message-id'
})

// Typing indicators
socket.emit('typing_start', { taskId: 'task-id' })
socket.emit('typing_stop', { taskId: 'task-id' })
```

#### **Server → Client:**
```javascript
// New message received
socket.on('new_message', (data) => {
  // data.message = full message object
  // data.taskId = task ID
})

// Message edited
socket.on('message_edited', (data) => {
  // data.message = updated message object
  // data.taskId = task ID
})

// Message deleted
socket.on('message_deleted', (data) => {
  // data.messageId = deleted message ID
  // data.taskId = task ID
})

// User joined task
socket.on('user_joined', (data) => {
  // data.userId, data.userName, data.timestamp
})

// User left task
socket.on('user_left', (data) => {
  // data.userId, data.userName, data.timestamp
})

// User typing
socket.on('user_typing', (data) => {
  // data.userId, data.userName
})

// User stopped typing
socket.on('user_stopped_typing', (data) => {
  // data.userId
})

// Task notifications
socket.on('task_notification', (data) => {
  // Custom notifications
})

// Task updates
socket.on('task_updated', (data) => {
  // Task changes
})

// Member changes
socket.on('member_changed', (data) => {
  // Member added/removed/updated
})

// Error handling
socket.on('error', (data) => {
  // data.message = error message
})
```

## 🎨 **Frontend Implementation**

### **1. Install Dependencies**

```bash
npm install socket.io-client
```

### **2. WebSocket Service**

```javascript
// src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:9553', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.socket.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Task room management
  joinTask(taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_task', taskId);
    }
  }

  leaveTask(taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_task', taskId);
    }
  }

  // Message events
  sendMessage(taskId, message, attachments = [], replyTo = null) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', {
        taskId,
        message,
        attachments,
        replyTo
      });
    }
  }

  editMessage(taskId, messageId, newMessage) {
    if (this.socket && this.isConnected) {
      this.socket.emit('edit_message', {
        taskId,
        messageId,
        newMessage
      });
    }
  }

  deleteMessage(taskId, messageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('delete_message', {
        taskId,
        messageId
      });
    }
  }

  // Typing indicators
  startTyping(taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { taskId });
    }
  }

  stopTyping(taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { taskId });
    }
  }

  // Event listeners
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageEdited(callback) {
    if (this.socket) {
      this.socket.on('message_edited', callback);
    }
  }

  onMessageDeleted(callback) {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user_joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user_left', callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default new WebSocketService();
```

### **3. WebSocket Hook**

```javascript
// src/hooks/useWebSocketChat.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import websocketService from '../services/websocketService';
import { toast } from 'react-toastify';

export const useWebSocketChat = (taskId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const { token } = useSelector(state => state.auth);
  const typingTimeoutRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    if (token && taskId) {
      websocketService.connect(token);
      
      // Set up connection status listener
      const checkConnection = () => {
        setIsConnected(websocketService.getConnectionStatus().isConnected);
      };
      
      const interval = setInterval(checkConnection, 1000);
      
      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    }
  }, [token, taskId]);

  // Join task room when connected
  useEffect(() => {
    if (isConnected && taskId) {
      websocketService.joinTask(taskId);
      
      return () => {
        websocketService.leaveTask(taskId);
      };
    }
  }, [isConnected, taskId]);

  // Set up event listeners
  useEffect(() => {
    if (!taskId) return;

    const handleNewMessage = (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => [data.message, ...prev]);
      }
    };

    const handleMessageEdited = (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => prev.map(msg => 
          msg.id === data.message.id ? data.message : msg
        ));
      }
    };

    const handleMessageDeleted = (data) => {
      if (data.taskId === taskId) {
        setMessages(prev => prev.filter(msg => msg.id !== data.messageId));
      }
    };

    const handleUserJoined = (data) => {
      if (data.taskId === taskId) {
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
          userId: data.userId,
          userName: data.userName,
          joinedAt: data.timestamp
        }]);
        
        toast.info(`${data.userName} joined the task`);
      }
    };

    const handleUserLeft = (data) => {
      if (data.taskId === taskId) {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        
        toast.info(`${data.userName} left the task`);
      }
    };

    const handleUserTyping = (data) => {
      if (data.taskId === taskId) {
        setTypingUsers(prev => [...prev.filter(u => u.userId !== data.userId), {
          userId: data.userId,
          userName: data.userName
        }]);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.taskId === taskId) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    };

    const handleError = (data) => {
      setError(data.message);
      toast.error(data.message);
    };

    // Register event listeners
    websocketService.onNewMessage(handleNewMessage);
    websocketService.onMessageEdited(handleMessageEdited);
    websocketService.onMessageDeleted(handleMessageDeleted);
    websocketService.onUserJoined(handleUserJoined);
    websocketService.onUserLeft(handleUserLeft);
    websocketService.onUserTyping(handleUserTyping);
    websocketService.onUserStoppedTyping(handleUserStoppedTyping);
    websocketService.onError(handleError);

    // Cleanup
    return () => {
      websocketService.off('new_message', handleNewMessage);
      websocketService.off('message_edited', handleMessageEdited);
      websocketService.off('message_deleted', handleMessageDeleted);
      websocketService.off('user_joined', handleUserJoined);
      websocketService.off('user_left', handleUserLeft);
      websocketService.off('user_typing', handleUserTyping);
      websocketService.off('user_stopped_typing', handleUserStoppedTyping);
      websocketService.off('error', handleError);
    };
  }, [taskId]);

  // Send message
  const sendMessage = useCallback((message, attachments = [], replyTo = null) => {
    if (!isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    websocketService.sendMessage(taskId, message, attachments, replyTo);
  }, [taskId, isConnected]);

  // Edit message
  const editMessage = useCallback((messageId, newMessage) => {
    if (!isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    websocketService.editMessage(taskId, messageId, newMessage);
  }, [taskId, isConnected]);

  // Delete message
  const deleteMessage = useCallback((messageId) => {
    if (!isConnected) {
      toast.error('Not connected to chat');
      return;
    }

    websocketService.deleteMessage(taskId, messageId);
  }, [taskId, isConnected]);

  // Typing indicators
  const startTyping = useCallback(() => {
    if (isConnected) {
      websocketService.startTyping(taskId);
    }
  }, [taskId, isConnected]);

  const stopTyping = useCallback(() => {
    if (isConnected) {
      websocketService.stopTyping(taskId);
    }
  }, [taskId, isConnected]);

  // Auto-stop typing after 3 seconds
  const handleTyping = useCallback(() => {
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [startTyping, stopTyping]);

  return {
    messages,
    typingUsers,
    onlineUsers,
    isConnected,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    handleTyping
  };
};
```

### **4. Enhanced Chat Component**

```javascript
// src/components/TaskView/TaskChatWebSocket.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useWebSocketChat } from '../../hooks/useWebSocketChat';
import { useSelector } from 'react-redux';

const TaskChatWebSocket = ({ taskId, permissions }) => {
  const {
    messages,
    typingUsers,
    onlineUsers,
    isConnected,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    handleTyping
  } = useWebSocketChat(taskId);

  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { user } = useSelector(state => state.auth);
  const canComment = permissions?.permissions?.can_comment !== false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !canComment || !isConnected) return;

    try {
      sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!isConnected) return;

    try {
      editMessage(messageId, editText.trim());
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?') || !isConnected) return;

    try {
      deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const startEdit = (message) => {
    setEditingMessage(message.id);
    setEditText(message.message);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0].userName} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    return `${typingUsers.length} people are typing...`;
  };

  return (
    <div className="task-chat-websocket">
      <div className="chat-header">
        <div className="chat-title">
          <h3>Task Chat</h3>
          <div className="chat-status">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </span>
            <span className="message-count">{messages.length} messages</span>
          </div>
        </div>
        
        <div className="online-users">
          <span className="online-count">{onlineUsers.length} online</span>
          {onlineUsers.length > 0 && (
            <div className="online-list">
              {onlineUsers.map(user => (
                <span key={user.userId} className="online-user">
                  {user.userName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className="chat-message">
            <div className="message-avatar">
              <img 
                src={message.avatar_url || '/default-avatar.png'} 
                alt={message.first_name}
              />
            </div>
            
            <div className="message-content">
              <div className="message-header">
                <span className="message-author">
                  {message.first_name} {message.last_name}
                </span>
                <span className="message-time">
                  {new Date(message.created_at).toLocaleString()}
                </span>
                {message.is_edited && (
                  <span className="message-edited">(edited)</span>
                )}
              </div>

              {editingMessage === message.id ? (
                <div className="message-edit">
                  <textarea
                    className="form-control"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="2"
                    ref={inputRef}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEditMessage(message.id)}
                    >
                      Save
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="message-text">{message.message}</div>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="attachment">
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        📎 {attachment.name}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {message.user_id === user?.id && (
                <div className="message-actions">
                  <button 
                    className="btn btn-sm btn-link"
                    onClick={() => startEdit(message)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-link text-danger"
                    onClick={() => handleDeleteMessage(message.id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {getTypingText() && (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">{getTypingText()}</span>
        </div>
      )}

      {canComment && (
        <form className="chat-input" onSubmit={handleSendMessage}>
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
            />
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
            >
              Send
            </button>
          </div>
        </form>
      )}

      {!canComment && (
        <div className="chat-no-permission">
          <p className="text-muted">You don't have permission to comment on this task</p>
        </div>
      )}

      {error && (
        <div className="chat-error">
          <p className="text-danger">Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default TaskChatWebSocket;
```

### **5. Enhanced CSS for WebSocket Features**

```css
/* src/styles/WebSocketChat.css */
.task-chat-websocket {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 600px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.chat-title h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.chat-status {
  display: flex;
  gap: 15px;
  align-items: center;
}

.connection-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
}

.connection-status.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.message-count {
  font-size: 14px;
  color: #666;
}

.online-users {
  text-align: right;
}

.online-count {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 5px;
}

.online-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.online-user {
  font-size: 11px;
  color: #28a745;
  background: #d4edda;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-radius: 18px;
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}

/* Real-time message animations */
.chat-message {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Message status indicators */
.message-sending {
  opacity: 0.6;
}

.message-sent {
  opacity: 1;
}

.message-failed {
  opacity: 0.6;
  border-left: 3px solid #dc3545;
  padding-left: 10px;
}
```

## 🔧 **Integration Steps**

### **1. Update Package.json**
```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2"
  }
}
```

### **2. Environment Variables**
```env
# .env
REACT_APP_API_URL=http://localhost:9553
REACT_APP_WEBSOCKET_URL=http://localhost:9553
```

### **3. Update Task View Page**
```javascript
// Replace TaskChat with TaskChatWebSocket
import TaskChatWebSocket from './TaskChatWebSocket';

// In TaskViewPage component
<TaskChatWebSocket 
  taskId={taskId} 
  permissions={user_permissions}
/>
```

### **4. Redux Integration (Optional)**
```javascript
// src/store/slices/websocketSlice.js
import { createSlice } from '@reduxjs/toolkit';

const websocketSlice = createSlice({
  name: 'websocket',
  initialState: {
    isConnected: false,
    reconnectAttempts: 0,
    onlineUsers: [],
    typingUsers: []
  },
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    }
  }
});

export const { setConnectionStatus, setOnlineUsers, setTypingUsers } = websocketSlice.actions;
export default websocketSlice.reducer;
```

## 🎯 **Benefits of WebSocket Chat**

### **✅ Real-time Experience:**
- Messages appear instantly
- No need to refresh or poll
- Better user engagement
- Professional chat experience

### **✅ Advanced Features:**
- Typing indicators
- User presence (online/offline)
- Instant message editing/deletion
- Real-time notifications

### **✅ Performance:**
- Reduced server load (no polling)
- Lower bandwidth usage
- Better scalability
- Faster response times

### **✅ User Experience:**
- WhatsApp/Telegram-like experience
- Instant feedback
- Better collaboration
- Professional appearance

## 🚀 **Testing WebSocket**

### **1. Start Server with WebSocket**
```bash
npm run dev
# Should see: "WebSocket server initialized for task chat"
```

### **2. Test Connection**
```javascript
// In browser console
const socket = io('http://localhost:9553', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.emit('join_task', 'task-id');
```

### **3. Test Real-time Messaging**
- Open multiple browser tabs
- Join same task
- Send messages - should appear instantly in all tabs
- Test typing indicators
- Test user join/leave notifications

## 📱 **Mobile Optimization**

```css
/* Mobile WebSocket chat */
@media (max-width: 768px) {
  .task-chat-websocket {
    height: 400px;
  }
  
  .chat-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .online-users {
    text-align: left;
  }
  
  .typing-indicator {
    font-size: 12px;
  }
}
```

## 🎉 **Summary**

WebSocket implementation memberikan:

✅ **Real-time Chat** - Instant messaging experience
✅ **Typing Indicators** - See who's typing
✅ **User Presence** - Online/offline status  
✅ **Instant Updates** - Edit/delete messages in real-time
✅ **Better Performance** - No polling required
✅ **Professional UX** - Like modern chat apps

**Chat sekarang menggunakan WebSocket untuk real-time experience!** 🚀
