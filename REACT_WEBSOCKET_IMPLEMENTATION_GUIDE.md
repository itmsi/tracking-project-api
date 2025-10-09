# 🔌 React WebSocket Implementation Guide

## 📋 Daftar Isi
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [WebSocket Hook](#websocket-hook)
- [Task Chat Component](#task-chat-component)
- [Authentication](#authentication)
- [Event Handlers](#event-handlers)
- [Error Handling](#error-handling)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Dokumentasi ini menjelaskan implementasi WebSocket di frontend React untuk fitur **Task Chat** yang sudah tersedia di backend sistem ini. WebSocket digunakan untuk real-time communication dalam task collaboration.

### 🏗️ Arsitektur
```
React Frontend → WebSocket → Backend (Port 9553)
```

### 📡 Port Configuration
- **Development**: `9553`
- **Production**: `9553`
- **Server**: `9553`

## 📦 Prerequisites

### Dependencies yang Diperlukan
```json
{
  "dependencies": {
    "socket.io-client": "^4.8.1",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Environment Variables
```env
# .env
REACT_APP_API_URL=http://localhost:9553
REACT_APP_WS_URL=http://localhost:9553
REACT_APP_FRONTEND_URL=http://localhost:3000
```

## 🚀 Installation

### 1. Install Socket.IO Client
```bash
npm install socket.io-client
# atau
yarn add socket.io-client
```

### 2. Install Additional Dependencies (Optional)
```bash
npm install @types/socket.io-client  # TypeScript support
npm install react-hot-toast          # Notifications
npm install date-fns                 # Date formatting
```

## 🔧 Basic Setup

### 1. WebSocket Service
```javascript
// src/services/websocket.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:9553', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventListeners();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected = false;
    });
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export default new WebSocketService();
```

### 2. WebSocket Context
```javascript
// src/contexts/WebSocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService from '../services/websocket';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      const socketInstance = WebSocketService.connect(token);
      setSocket(socketInstance);

      socketInstance.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        setConnectionError(error.message);
        setIsConnected(false);
      });

      return () => {
        WebSocketService.disconnect();
      };
    }
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
    reconnect: () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        WebSocketService.connect(token);
      }
    }
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
```

## 🎣 WebSocket Hook

### Custom Hook untuk Task Chat
```javascript
// src/hooks/useTaskChat.js
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import toast from 'react-hot-toast';

export const useTaskChat = (taskId) => {
  const { socket, isConnected } = useWebSocket();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Join task room
  const joinTask = useCallback(() => {
    if (socket && taskId) {
      socket.emit('join_task', taskId);
    }
  }, [socket, taskId]);

  // Leave task room
  const leaveTask = useCallback(() => {
    if (socket && taskId) {
      socket.emit('leave_task', taskId);
    }
  }, [socket, taskId]);

  // Send message
  const sendMessage = useCallback(async (message, attachments = [], replyTo = null) => {
    if (!socket || !taskId || !message.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      socket.emit('send_message', {
        taskId,
        message: message.trim(),
        attachments,
        replyTo
      });
    } catch (err) {
      setError('Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  }, [socket, taskId]);

  // Edit message
  const editMessage = useCallback((messageId, newMessage) => {
    if (!socket || !taskId || !messageId || !newMessage.trim()) {
      return;
    }

    socket.emit('edit_message', {
      taskId,
      messageId,
      newMessage: newMessage.trim()
    });
  }, [socket, taskId]);

  // Delete message
  const deleteMessage = useCallback((messageId) => {
    if (!socket || !taskId || !messageId) {
      return;
    }

    socket.emit('delete_message', {
      taskId,
      messageId
    });
  }, [socket, taskId]);

  // Start typing
  const startTyping = useCallback(() => {
    if (socket && taskId && !isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', { taskId });
    }
  }, [socket, taskId, isTyping]);

  // Stop typing
  const stopTyping = useCallback(() => {
    if (socket && taskId && isTyping) {
      setIsTyping(false);
      socket.emit('typing_stop', { taskId });
    }
  }, [socket, taskId, isTyping]);

  // Setup event listeners
  useEffect(() => {
    if (!socket) return;

    // Message events
    socket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    socket.on('message_edited', (data) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.message.id ? data.message : msg
        )
      );
    });

    socket.on('message_deleted', (data) => {
      setMessages(prev => 
        prev.filter(msg => msg.id !== data.messageId)
      );
    });

    // User events
    socket.on('user_joined', (data) => {
      setOnlineUsers(prev => [...prev, data]);
      toast.success(`${data.userName} joined the chat`);
    });

    socket.on('user_left', (data) => {
      setOnlineUsers(prev => 
        prev.filter(user => user.userId !== data.userId)
      );
      toast.info(`${data.userName} left the chat`);
    });

    // Typing events
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const exists = prev.find(user => user.userId === data.userId);
        if (!exists) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => 
        prev.filter(user => user.userId !== data.userId)
      );
    });

    // Task events
    socket.on('task_notification', (notification) => {
      toast.info(notification.message);
    });

    socket.on('task_updated', (update) => {
      toast.info('Task has been updated');
    });

    socket.on('member_changed', (change) => {
      toast.info('Task members have changed');
    });

    // Error handling
    socket.on('error', (error) => {
      setError(error.message);
      toast.error(error.message);
    });

    return () => {
      socket.off('new_message');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
      socket.off('task_notification');
      socket.off('task_updated');
      socket.off('member_changed');
      socket.off('error');
    };
  }, [socket]);

  // Auto join/leave task
  useEffect(() => {
    if (isConnected && taskId) {
      joinTask();
    }

    return () => {
      if (taskId) {
        leaveTask();
      }
    };
  }, [isConnected, taskId, joinTask, leaveTask]);

  // Auto stop typing on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return {
    messages,
    isConnected,
    isLoading,
    error,
    typingUsers,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    joinTask,
    leaveTask
  };
};
```

## 💬 Task Chat Component

### Main Chat Component
```javascript
// src/components/TaskChat/TaskChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTaskChat } from '../../hooks/useTaskChat';
import { format } from 'date-fns';
import './TaskChat.css';

const TaskChat = ({ taskId, currentUser }) => {
  const {
    messages,
    isConnected,
    isLoading,
    error,
    typingUsers,
    onlineUsers,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping
  } = useTaskChat(taskId);

  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (value.trim()) {
      startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    } else {
      stopTyping();
    }
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() && !isLoading) {
      sendMessage(newMessage.trim());
      setNewMessage('');
      stopTyping();
    }
  };

  // Handle edit message
  const handleEditMessage = (messageId, currentText) => {
    setEditingMessage(messageId);
    setEditText(currentText);
  };

  // Handle save edit
  const handleSaveEdit = (messageId) => {
    if (editText.trim()) {
      editMessage(messageId, editText.trim());
      setEditingMessage(null);
      setEditText('');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  // Handle delete message
  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(messageId);
    }
  };

  if (!isConnected) {
    return (
      <div className="task-chat-disconnected">
        <div className="connection-status">
          <span className="status-indicator offline"></span>
          <span>Connecting to chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="task-chat">
      {/* Header */}
      <div className="chat-header">
        <h3>Task Chat</h3>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="online-users">
          <span>Online: </span>
          {onlineUsers.map(user => (
            <span key={user.userId} className="online-user">
              {user.userName}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              <span className="message-author">
                {message.user?.first_name} {message.user?.last_name}
              </span>
              <span className="message-time">
                {format(new Date(message.created_at), 'HH:mm')}
              </span>
            </div>
            
            {editingMessage === message.id ? (
              <div className="message-edit">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="edit-textarea"
                />
                <div className="edit-actions">
                  <button onClick={() => handleSaveEdit(message.id)}>
                    Save
                  </button>
                  <button onClick={handleCancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="message-content">
                <p>{message.message}</p>
                
                {/* Message Actions */}
                {message.user_id === currentUser.id && (
                  <div className="message-actions">
                    <button onClick={() => handleEditMessage(message.id, message.message)}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteMessage(message.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.map(user => (
              <span key={user.userId}>{user.userName}</span>
            ))}
            <span> is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input-form">
        <div className="message-input-container">
          <textarea
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="chat-error">
          <span>Error: {error}</span>
        </div>
      )}
    </div>
  );
};

export default TaskChat;
```

### CSS Styles
```css
/* src/components/TaskChat/TaskChat.css */
.task-chat {
  display: flex;
  flex-direction: column;
  height: 600px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f5f5;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background-color: #4caf50;
}

.status-indicator.offline {
  background-color: #f44336;
}

.online-users {
  padding: 8px 16px;
  background: #f0f8ff;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
}

.online-user {
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-size: 12px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-author {
  font-weight: 600;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #666;
}

.message-content {
  position: relative;
}

.message-content p {
  margin: 0;
  line-height: 1.4;
}

.message-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.message-actions button {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.message-actions button:hover {
  background: #e0e0e0;
}

.message-edit {
  margin-top: 8px;
}

.edit-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.edit-actions button {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-actions button:first-child {
  background: #4caf50;
  color: white;
}

.edit-actions button:last-child {
  background: #f44336;
  color: white;
}

.typing-indicator {
  padding: 8px 16px;
  font-style: italic;
  color: #666;
  font-size: 14px;
}

.message-input-form {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.message-input-container {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  outline: none;
}

.message-input:focus {
  border-color: #4caf50;
}

.send-button {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.chat-error {
  padding: 8px 16px;
  background: #ffebee;
  color: #c62828;
  border-top: 1px solid #e0e0e0;
  font-size: 14px;
}

.task-chat-disconnected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 600px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
```

## 🔐 Authentication

### Auth Context Integration
```javascript
// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🎯 Event Handlers

### Complete Event List
```javascript
// src/utils/websocketEvents.js
export const WEBSOCKET_EVENTS = {
  // Client to Server
  JOIN_TASK: 'join_task',
  LEAVE_TASK: 'leave_task',
  SEND_MESSAGE: 'send_message',
  EDIT_MESSAGE: 'edit_message',
  DELETE_MESSAGE: 'delete_message',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',

  // Server to Client
  NEW_MESSAGE: 'new_message',
  MESSAGE_EDITED: 'message_edited',
  MESSAGE_DELETED: 'message_deleted',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  TASK_NOTIFICATION: 'task_notification',
  TASK_UPDATED: 'task_updated',
  MEMBER_CHANGED: 'member_changed',
  ERROR: 'error'
};
```

## 🚨 Error Handling

### Error Boundary Component
```javascript
// src/components/ErrorBoundary/WebSocketErrorBoundary.jsx
import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';

const WebSocketErrorBoundary = ({ children }) => {
  const { connectionError, reconnect } = useWebSocket();

  if (connectionError) {
    return (
      <div className="websocket-error-boundary">
        <div className="error-content">
          <h3>Connection Error</h3>
          <p>{connectionError}</p>
          <button onClick={reconnect} className="reconnect-button">
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default WebSocketErrorBoundary;
```

## 📱 Complete Example

### App.js Integration
```javascript
// src/App.js
import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import WebSocketErrorBoundary from './components/ErrorBoundary/WebSocketErrorBoundary';
import TaskChat from './components/TaskChat/TaskChat';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <WebSocketErrorBoundary>
          <div className="App">
            <header className="App-header">
              <h1>Task Management System</h1>
            </header>
            
            <main>
              {/* Example usage */}
              <TaskChat 
                taskId="task-123" 
                currentUser={{ id: 1, first_name: 'John', last_name: 'Doe' }}
              />
            </main>
            
            <Toaster position="top-right" />
          </div>
        </WebSocketErrorBoundary>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
```

## 🎯 Best Practices

### 1. Connection Management
- ✅ Always check connection status before sending events
- ✅ Implement automatic reconnection
- ✅ Handle connection errors gracefully
- ✅ Clean up event listeners on unmount

### 2. Authentication
- ✅ Pass JWT token in WebSocket auth
- ✅ Handle authentication errors
- ✅ Reconnect with new token after login

### 3. Performance
- ✅ Debounce typing indicators
- ✅ Limit message history
- ✅ Use React.memo for message components
- ✅ Implement virtual scrolling for large chat histories

### 4. User Experience
- ✅ Show connection status
- ✅ Display typing indicators
- ✅ Show online users
- ✅ Provide feedback for all actions
- ✅ Handle offline scenarios

### 5. Security
- ✅ Validate all user inputs
- ✅ Sanitize message content
- ✅ Implement rate limiting on client side
- ✅ Use HTTPS/WSS in production

## 🔧 Troubleshooting

### Common Issues

#### 1. Connection Failed
```javascript
// Check these:
- Verify REACT_APP_WS_URL is correct
- Check if backend is running
- Verify CORS configuration
- Check authentication token
```

#### 2. Messages Not Sending
```javascript
// Debug steps:
- Check WebSocket connection status
- Verify user has task access
- Check browser console for errors
- Validate message format
```

#### 3. Authentication Errors
```javascript
// Solutions:
- Ensure JWT token is valid
- Check token expiration
- Verify token format in auth header
- Re-login if token expired
```

#### 4. Performance Issues
```javascript
// Optimizations:
- Implement message pagination
- Use React.memo for components
- Debounce typing indicators
- Limit re-renders
```

### Debug Tools
```javascript
// Add to WebSocket service for debugging
socket.onAny((eventName, ...args) => {
  console.log('WebSocket Event:', eventName, args);
});
```

## 📚 Additional Resources

### Documentation Links
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
- [Date-fns Documentation](https://date-fns.org/)

### Example Repositories
- [Socket.IO React Chat Example](https://github.com/socketio/chat-example)
- [Real-time React Applications](https://github.com/topics/react-websocket)

---

## 🎉 Conclusion

Implementasi WebSocket di React untuk sistem Task Chat ini menyediakan:

- ✅ **Real-time Communication** - Instant messaging dalam task
- ✅ **User Presence** - Online users dan typing indicators  
- ✅ **Message Management** - CRUD operations untuk messages
- ✅ **Error Handling** - Robust error handling dan recovery
- ✅ **Authentication** - Secure JWT-based authentication
- ✅ **Performance** - Optimized untuk production use

Dengan mengikuti panduan ini, Anda dapat mengintegrasikan WebSocket chat functionality ke dalam aplikasi React dengan mudah dan efisien! 🚀
