# 🚀 React WebSocket Implementation Examples

## 📋 Quick Start Examples

### 1. Basic WebSocket Connection
```javascript
// src/components/BasicWebSocketExample.jsx
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const BasicWebSocketExample = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Get token from localStorage or auth context
    const token = localStorage.getItem('authToken');
    
    // Create socket connection
    const socketInstance = io('http://localhost:9513', {
      auth: {
        token: token
      }
    });

    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    // Message events
    socketInstance.on('new_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    // Cleanup
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (socket && newMessage.trim()) {
      socket.emit('send_message', {
        taskId: 'your-task-id',
        message: newMessage.trim()
      });
      setNewMessage('');
    }
  };

  return (
    <div>
      <h3>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</h3>
      
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user?.first_name}:</strong> {msg.message}
          </div>
        ))}
      </div>
      
      <div>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} disabled={!isConnected}>
          Send
        </button>
      </div>
    </div>
  );
};

export default BasicWebSocketExample;
```

### 2. Task Chat Integration
```javascript
// src/components/TaskDetail/TaskChatSection.jsx
import React from 'react';
import { useTaskChat } from '../../hooks/useTaskChat';
import { useAuth } from '../../contexts/AuthContext';

const TaskChatSection = ({ taskId }) => {
  const { user } = useAuth();
  const {
    messages,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers
  } = useTaskChat(taskId);

  if (!isConnected) {
    return (
      <div className="chat-disconnected">
        <p>Connecting to chat...</p>
      </div>
    );
  }

  return (
    <div className="task-chat-section">
      <h4>Task Discussion</h4>
      
      {/* Messages */}
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              <span className="author">
                {message.user?.first_name} {message.user?.last_name}
              </span>
              <span className="time">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.message}
            </div>
          </div>
        ))}
      </div>

      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map(user => user.userName).join(', ')} is typing...
        </div>
      )}

      {/* Message Input */}
      <MessageInput 
        onSendMessage={sendMessage}
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  );
};

const MessageInput = ({ onSendMessage, onTyping, onStopTyping }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleTyping = (value) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      onTyping();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onStopTyping();
    }, 1000);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      onStopTyping();
    }
  };

  return (
    <form onSubmit={handleSend} className="message-input">
      <input
        type="text"
        value={message}
        onChange={(e) => handleTyping(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default TaskChatSection;
```

### 3. Real-time Notifications
```javascript
// src/components/Notifications/RealTimeNotifications.jsx
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import toast from 'react-hot-toast';

const RealTimeNotifications = () => {
  const { socket } = useWebSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Task notifications
    socket.on('task_notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
      toast.info(notification.message);
    });

    // Task updates
    socket.on('task_updated', (update) => {
      toast.success('Task has been updated');
    });

    // Member changes
    socket.on('member_changed', (change) => {
      toast.info('Task members have changed');
    });

    return () => {
      socket.off('task_notification');
      socket.off('task_updated');
      socket.off('member_changed');
    };
  }, [socket]);

  return (
    <div className="notifications">
      {notifications.map((notification, index) => (
        <div key={index} className="notification">
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default RealTimeNotifications;
```

### 4. Connection Status Component
```javascript
// src/components/WebSocket/ConnectionStatus.jsx
import React from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';

const ConnectionStatus = () => {
  const { isConnected, connectionError, reconnect } = useWebSocket();

  if (connectionError) {
    return (
      <div className="connection-error">
        <span className="status-indicator error"></span>
        <span>Connection Error: {connectionError}</span>
        <button onClick={reconnect} className="reconnect-btn">
          Reconnect
        </button>
      </div>
    );
  }

  return (
    <div className="connection-status">
      <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></span>
      <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
    </div>
  );
};

export default ConnectionStatus;
```

### 5. Message Component with Actions
```javascript
// src/components/Chat/Message.jsx
import React, { useState } from 'react';
import { useTaskChat } from '../../hooks/useTaskChat';
import { useAuth } from '../../contexts/AuthContext';

const Message = ({ message, taskId }) => {
  const { user } = useAuth();
  const { editMessage, deleteMessage } = useTaskChat(taskId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message);
  const [showActions, setShowActions] = useState(false);

  const isOwner = message.user_id === user.id;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.message) {
      editMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(message.message);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message.id);
    }
  };

  return (
    <div 
      className="message"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-header">
        <span className="author">
          {message.user?.first_name} {message.user?.last_name}
        </span>
        <span className="timestamp">
          {new Date(message.created_at).toLocaleString()}
        </span>
      </div>

      {isEditing ? (
        <div className="message-edit">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={handleSaveEdit}>Save</button>
            <button onClick={handleCancelEdit}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="message-content">
          <p>{message.message}</p>
          
          {isOwner && showActions && (
            <div className="message-actions">
              <button onClick={handleEdit}>Edit</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Message;
```

## 🔧 Configuration Examples

### 1. Environment Configuration
```javascript
// src/config/websocket.js
const WEBSOCKET_CONFIG = {
  development: {
    url: 'http://localhost:9513',
    options: {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    }
  },
  production: {
    url: 'https://your-domain.com:9509',
    options: {
      transports: ['websocket'],
      timeout: 20000,
      forceNew: true
    }
  }
};

export const getWebSocketConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return WEBSOCKET_CONFIG[env];
};
```

### 2. WebSocket Service with Retry Logic
```javascript
// src/services/websocketWithRetry.js
import { io } from 'socket.io-client';

class WebSocketServiceWithRetry {
  constructor() {
    this.socket = null;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000;
  }

  connect(token, onConnect, onError) {
    const config = getWebSocketConfig();
    
    this.socket = io(config.url, {
      ...config.options,
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.retryCount = 0;
      onConnect?.(this.socket);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError(onError);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, don't retry
        return;
      }
      this.handleConnectionError(onError);
    });

    return this.socket;
  }

  handleConnectionError(onError) {
    onError?.();
    
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
      
      console.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount})`);
      
      setTimeout(() => {
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max retry attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new WebSocketServiceWithRetry();
```

## 🎨 Styling Examples

### 1. Modern Chat Interface
```css
/* src/styles/chat.css */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #f8f9fa;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: white;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  background: #f1f3f4;
  position: relative;
}

.message.own {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: 2rem;
}

.message.other {
  background: #e3f2fd;
  margin-right: 2rem;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.message-author {
  font-weight: 600;
}

.message-time {
  opacity: 0.7;
}

.message-content {
  line-height: 1.5;
}

.message-input-container {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.message-input-form {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
}

.message-input:focus {
  border-color: #667eea;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

.send-button:hover {
  transform: translateY(-1px);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.typing-indicator {
  padding: 0.5rem 1rem;
  font-style: italic;
  color: #666;
  font-size: 0.875rem;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.connected {
  background-color: #4caf50;
  animation: pulse 2s infinite;
}

.status-indicator.disconnected {
  background-color: #f44336;
}

.status-indicator.error {
  background-color: #ff9800;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
```

## 🧪 Testing Examples

### 1. WebSocket Hook Test
```javascript
// src/hooks/__tests__/useTaskChat.test.js
import { renderHook, act } from '@testing-library/react';
import { useTaskChat } from '../useTaskChat';
import { WebSocketProvider } from '../../contexts/WebSocketContext';

// Mock WebSocket
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true
};

jest.mock('../../services/websocket', () => ({
  connect: () => mockSocket,
  disconnect: jest.fn()
}));

const wrapper = ({ children }) => (
  <WebSocketProvider>{children}</WebSocketProvider>
);

describe('useTaskChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should join task on mount', () => {
    renderHook(() => useTaskChat('task-123'), { wrapper });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('join_task', 'task-123');
  });

  it('should send message', () => {
    const { result } = renderHook(() => useTaskChat('task-123'), { wrapper });
    
    act(() => {
      result.current.sendMessage('Hello world');
    });
    
    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
      taskId: 'task-123',
      message: 'Hello world',
      attachments: [],
      replyTo: null
    });
  });
});
```

### 2. Component Test
```javascript
// src/components/__tests__/TaskChat.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskChat from '../TaskChat/TaskChat';

// Mock the hook
jest.mock('../../hooks/useTaskChat', () => ({
  useTaskChat: () => ({
    messages: [
      {
        id: 1,
        message: 'Hello world',
        user: { first_name: 'John', last_name: 'Doe' },
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    isConnected: true,
    sendMessage: jest.fn(),
    startTyping: jest.fn(),
    stopTyping: jest.fn()
  })
}));

describe('TaskChat', () => {
  it('renders messages', () => {
    render(
      <TaskChat 
        taskId="task-123" 
        currentUser={{ id: 1, first_name: 'John', last_name: 'Doe' }}
      />
    );
    
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('sends message on form submit', () => {
    const mockSendMessage = jest.fn();
    jest.mocked(useTaskChat).mockReturnValue({
      messages: [],
      isConnected: true,
      sendMessage: mockSendMessage,
      startTyping: jest.fn(),
      stopTyping: jest.fn()
    });

    render(
      <TaskChat 
        taskId="task-123" 
        currentUser={{ id: 1, first_name: 'John', last_name: 'Doe' }}
      />
    );
    
    const input = screen.getByPlaceholderText('Type your message...');
    const button = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(button);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });
});
```

## 📱 Mobile Responsive Example
```css
/* src/styles/mobile-chat.css */
@media (max-width: 768px) {
  .chat-container {
    height: 100vh;
    max-width: 100%;
  }
  
  .message {
    margin-left: 0.5rem;
    margin-right: 0.5rem;
  }
  
  .message.own {
    margin-left: 1rem;
  }
  
  .message.other {
    margin-right: 1rem;
  }
  
  .message-input-form {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .message-input {
    min-height: 50px;
  }
  
  .send-button {
    width: 100%;
    padding: 1rem;
  }
}
```

## 🎯 Production Checklist

### Before Deployment
- [ ] Set correct WebSocket URL for production
- [ ] Enable HTTPS/WSS for secure connections
- [ ] Configure CORS properly
- [ ] Set up error monitoring
- [ ] Test connection recovery
- [ ] Optimize bundle size
- [ ] Add loading states
- [ ] Test on mobile devices
- [ ] Set up rate limiting
- [ ] Configure logging

### Performance Optimizations
- [ ] Implement message pagination
- [ ] Use React.memo for message components
- [ ] Debounce typing indicators
- [ ] Implement virtual scrolling
- [ ] Optimize re-renders
- [ ] Use WebSocket compression
- [ ] Implement connection pooling

---

## 🎉 Summary

Dengan contoh-contoh di atas, Anda dapat:

1. **✅ Implementasi Basic** - Koneksi WebSocket sederhana
2. **✅ Task Chat Integration** - Chat terintegrasi dengan task
3. **✅ Real-time Notifications** - Notifikasi real-time
4. **✅ Connection Management** - Status koneksi dan retry logic
5. **✅ Message Actions** - Edit dan delete messages
6. **✅ Modern Styling** - UI yang menarik dan responsive
7. **✅ Testing** - Unit tests untuk hooks dan components
8. **✅ Mobile Support** - Responsive design untuk mobile

Semua contoh menggunakan **port yang sama** dengan aplikasi utama (9509/9513) dan mengikuti best practices untuk WebSocket implementation! 🚀
