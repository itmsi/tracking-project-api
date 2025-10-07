# 🎯 Task View Frontend Integration Guide

## 📋 **Overview**

Dokumentasi ini menjelaskan cara mengintegrasikan fitur **Task View** yang baru dengan frontend React JS. Fitur ini mencakup:

- ✅ **Task Details Management** - Detail task dengan description, requirements, acceptance criteria
- ✅ **Task Chat System** - Real-time chat antar member task
- ✅ **File Attachments** - Upload dan manage file attachments
- ✅ **Member Management** - Add/remove members dengan role-based permissions
- ✅ **Complete Task View** - One-stop endpoint untuk semua data task

## 🚀 **Quick Start**

### **1. Setup API Service**

```javascript
// src/services/taskViewService.js
import apiClient from './apiClient';

export const taskViewService = {
  // Complete Task View
  getTaskView: (taskId) => 
    apiClient.get(`/api/tasks/${taskId}/view`),

  // Task Details
  getTaskDetails: (taskId) => 
    apiClient.get(`/api/tasks/${taskId}/details`),
  
  createTaskDetails: (taskId, data) => 
    apiClient.post(`/api/tasks/${taskId}/details`, data),
  
  updateTaskDetails: (taskId, data) => 
    apiClient.put(`/api/tasks/${taskId}/details`, data),

  // Task Chat
  getTaskChat: (taskId, params = {}) => 
    apiClient.get(`/api/tasks/${taskId}/chat`, { params }),
  
  createChatMessage: (taskId, data) => 
    apiClient.post(`/api/tasks/${taskId}/chat`, data),
  
  updateChatMessage: (taskId, messageId, data) => 
    apiClient.put(`/api/tasks/${taskId}/chat/${messageId}`, data),
  
  deleteChatMessage: (taskId, messageId) => 
    apiClient.delete(`/api/tasks/${taskId}/chat/${messageId}`),

  // Task Attachments
  getTaskAttachments: (taskId, params = {}) => 
    apiClient.get(`/api/tasks/${taskId}/attachments`, { params }),
  
  uploadAttachment: (taskId, file, data = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    return apiClient.post(`/api/tasks/${taskId}/attachments/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  deleteAttachment: (taskId, attachmentId) => 
    apiClient.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`),

  // Task Members
  getTaskMembers: (taskId, params = {}) => 
    apiClient.get(`/api/tasks/${taskId}/members`, { params }),
  
  addTaskMember: (taskId, data) => 
    apiClient.post(`/api/tasks/${taskId}/members`, data),
  
  updateTaskMember: (taskId, memberId, data) => 
    apiClient.put(`/api/tasks/${taskId}/members/${memberId}`, data),
  
  removeTaskMember: (taskId, memberId) => 
    apiClient.delete(`/api/tasks/${taskId}/members/${memberId}`),
  
  searchUsersForTask: (taskId, query, limit = 10) => 
    apiClient.get(`/api/tasks/${taskId}/members/search`, { 
      params: { q: query, limit } 
    })
};
```

### **2. Custom Hooks**

```javascript
// src/hooks/useTaskView.js
import { useState, useEffect } from 'react';
import { taskViewService } from '../services/taskViewService';

export const useTaskView = (taskId) => {
  const [taskView, setTaskView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchTaskView = async () => {
      try {
        setLoading(true);
        const response = await taskViewService.getTaskView(taskId);
        setTaskView(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load task view');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskView();
  }, [taskId]);

  return { taskView, loading, error, refetch: () => fetchTaskView() };
};

// src/hooks/useTaskChat.js
import { useState, useEffect, useCallback } from 'react';
import { taskViewService } from '../services/taskViewService';

export const useTaskChat = (taskId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadMessages = useCallback(async (reset = false) => {
    if (!taskId) return;

    try {
      setLoading(true);
      const newOffset = reset ? 0 : offset;
      const response = await taskViewService.getTaskChat(taskId, {
        limit: 50,
        offset: newOffset
      });

      const newMessages = response.data.messages;
      
      if (reset) {
        setMessages(newMessages);
        setOffset(50);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
        setOffset(prev => prev + 50);
      }

      setHasMore(newMessages.length === 50);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [taskId, offset]);

  const sendMessage = async (message, attachments = []) => {
    try {
      const response = await taskViewService.createChatMessage(taskId, {
        message,
        attachments
      });
      
      setMessages(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to send message');
    }
  };

  const updateMessage = async (messageId, newMessage) => {
    try {
      const response = await taskViewService.updateChatMessage(taskId, messageId, {
        message: newMessage
      });
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? response.data : msg
      ));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update message');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await taskViewService.deleteChatMessage(taskId, messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete message');
    }
  };

  useEffect(() => {
    loadMessages(true);
  }, [taskId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMore: () => loadMessages(false),
    refresh: () => loadMessages(true)
  };
};

// src/hooks/useTaskAttachments.js
import { useState, useEffect } from 'react';
import { taskViewService } from '../services/taskViewService';

export const useTaskAttachments = (taskId) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadAttachments = async (filters = {}) => {
    if (!taskId) return;

    try {
      setLoading(true);
      const response = await taskViewService.getTaskAttachments(taskId, filters);
      setAttachments(response.data.attachments);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file, metadata = {}) => {
    try {
      setUploading(true);
      const response = await taskViewService.uploadAttachment(taskId, file, {
        file_type: getFileType(file.type),
        description: metadata.description || '',
        is_public: metadata.isPublic !== false
      });
      
      setAttachments(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (attachmentId) => {
    try {
      await taskViewService.deleteAttachment(taskId, attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  return {
    attachments,
    loading,
    error,
    uploading,
    uploadFile,
    deleteFile,
    refresh: loadAttachments
  };
};

// src/hooks/useTaskMembers.js
import { useState, useEffect } from 'react';
import { taskViewService } from '../services/taskViewService';

export const useTaskMembers = (taskId) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = async () => {
    if (!taskId) return;

    try {
      setLoading(true);
      const response = await taskViewService.getTaskMembers(taskId);
      setMembers(response.data.members);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (userId, role = 'member', permissions = {}) => {
    try {
      const response = await taskViewService.addTaskMember(taskId, {
        user_id: userId,
        role,
        ...permissions
      });
      
      setMembers(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const updateMember = async (memberId, updates) => {
    try {
      const response = await taskViewService.updateTaskMember(taskId, memberId, updates);
      
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, ...response.data } : member
      ));
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update member');
    }
  };

  const removeMember = async (memberId) => {
    try {
      await taskViewService.removeTaskMember(taskId, memberId);
      setMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const searchUsers = async (query) => {
    try {
      const response = await taskViewService.searchUsersForTask(taskId, query);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to search users');
    }
  };

  useEffect(() => {
    loadMembers();
  }, [taskId]);

  return {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    searchUsers,
    refresh: loadMembers
  };
};
```

## 🎨 **React Components**

### **1. Task View Page**

```javascript
// src/components/TaskView/TaskViewPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTaskView } from '../../hooks/useTaskView';
import TaskDetails from './TaskDetails';
import TaskChat from './TaskChat';
import TaskAttachments from './TaskAttachments';
import TaskMembers from './TaskMembers';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const TaskViewPage = () => {
  const { taskId } = useParams();
  const { taskView, loading, error, refetch } = useTaskView(taskId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!taskView) return <div>Task not found</div>;

  const { task, details, members, attachments, chat, user_permissions } = taskView;

  return (
    <div className="task-view-page">
      <div className="task-header">
        <h1>{task.title}</h1>
        <div className="task-meta">
          <span className={`status status-${task.status}`}>{task.status}</span>
          <span className="priority">{task.priority}</span>
          <span className="due-date">{task.due_date}</span>
        </div>
      </div>

      <div className="task-content">
        <div className="task-main">
          <TaskDetails 
            taskId={taskId} 
            details={details} 
            permissions={user_permissions}
          />
          <TaskChat 
            taskId={taskId} 
            initialMessages={chat.messages}
            permissions={user_permissions}
          />
        </div>

        <div className="task-sidebar">
          <TaskMembers 
            taskId={taskId} 
            members={members}
            permissions={user_permissions}
          />
          <TaskAttachments 
            taskId={taskId} 
            attachments={attachments}
            permissions={user_permissions}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskViewPage;
```

### **2. Task Details Component**

```javascript
// src/components/TaskView/TaskDetails.jsx
import React, { useState } from 'react';
import { taskViewService } from '../../services/taskViewService';
import { toast } from 'react-toastify';

const TaskDetails = ({ taskId, details, permissions }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: details?.description || '',
    requirements: details?.requirements || '',
    acceptance_criteria: details?.acceptance_criteria || ''
  });
  const [saving, setSaving] = useState(false);

  const canEdit = permissions?.isOwner || permissions?.role === 'admin';

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (details) {
        await taskViewService.updateTaskDetails(taskId, formData);
        toast.success('Task details updated successfully');
      } else {
        await taskViewService.createTaskDetails(taskId, formData);
        toast.success('Task details created successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      description: details?.description || '',
      requirements: details?.requirements || '',
      acceptance_criteria: details?.acceptance_criteria || ''
    });
    setIsEditing(false);
  };

  if (!canEdit && !details) {
    return (
      <div className="task-details">
        <h3>Task Details</h3>
        <p className="text-muted">No details available</p>
      </div>
    );
  }

  return (
    <div className="task-details">
      <div className="task-details-header">
        <h3>Task Details</h3>
        {canEdit && (
          <div className="task-details-actions">
            {isEditing ? (
              <>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                className="btn btn-outline-primary" 
                onClick={() => setIsEditing(true)}
              >
                Edit Details
              </button>
            )}
          </div>
        )}
      </div>

      <div className="task-details-content">
        <div className="form-group">
          <label>Description</label>
          {isEditing ? (
            <textarea
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description..."
            />
          ) : (
            <div className="task-detail-text">
              {details?.description || 'No description provided'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Requirements</label>
          {isEditing ? (
            <textarea
              className="form-control"
              rows="6"
              value={formData.requirements}
              onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              placeholder="Enter requirements..."
            />
          ) : (
            <div className="task-detail-text">
              {details?.requirements || 'No requirements specified'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Acceptance Criteria</label>
          {isEditing ? (
            <textarea
              className="form-control"
              rows="6"
              value={formData.acceptance_criteria}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptance_criteria: e.target.value }))}
              placeholder="Enter acceptance criteria..."
            />
          ) : (
            <div className="task-detail-text">
              {details?.acceptance_criteria || 'No acceptance criteria defined'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
```

### **3. Task Chat Component**

```javascript
// src/components/TaskView/TaskChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTaskChat } from '../../hooks/useTaskChat';
import { toast } from 'react-toastify';

const TaskChat = ({ taskId, initialMessages, permissions }) => {
  const {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    loadMore
  } = useTaskChat(taskId);

  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const canComment = permissions?.permissions?.can_comment !== false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !canComment) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEditMessage = async (messageId) => {
    try {
      await updateMessage(messageId, editText.trim());
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(messageId);
    } catch (error) {
      toast.error(error.message);
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

  if (error) {
    return (
      <div className="task-chat">
        <div className="chat-error">
          <p>Error loading chat: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-chat">
      <div className="chat-header">
        <h3>Task Chat</h3>
        <span className="message-count">{messages.length} messages</span>
      </div>

      <div className="chat-messages">
        {hasMore && (
          <div className="load-more">
            <button 
              className="btn btn-link" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load more messages'}
            </button>
          </div>
        )}

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

              {message.user_id === permissions?.userId && (
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

      {canComment && (
        <form className="chat-input" onSubmit={handleSendMessage}>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
            />
            <button 
              className="btn btn-primary" 
              type="submit"
              disabled={!newMessage.trim() || loading}
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
    </div>
  );
};

export default TaskChat;
```

### **4. Task Attachments Component**

```javascript
// src/components/TaskView/TaskAttachments.jsx
import React, { useState } from 'react';
import { useTaskAttachments } from '../../hooks/useTaskAttachments';
import { toast } from 'react-toastify';

const TaskAttachments = ({ taskId, attachments: initialAttachments, permissions }) => {
  const {
    attachments,
    loading,
    error,
    uploading,
    uploadFile,
    deleteFile,
    refresh
  } = useTaskAttachments(taskId);

  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const canUpload = permissions?.permissions?.can_upload !== false;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile, {
        description: fileDescription,
        isPublic
      });
      
      setSelectedFile(null);
      setFileDescription('');
      setIsPublic(true);
      setShowUpload(false);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (attachmentId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await deleteFile(attachmentId);
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <div className="task-attachments">
        <div className="attachments-error">
          <p>Error loading attachments: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-attachments">
      <div className="attachments-header">
        <h3>Attachments</h3>
        <div className="attachments-actions">
          <span className="attachment-count">{attachments.length} files</span>
          {canUpload && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowUpload(!showUpload)}
            >
              Upload File
            </button>
          )}
        </div>
      </div>

      {showUpload && canUpload && (
        <div className="upload-form">
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <input
                type="file"
                className="form-control"
                onChange={handleFileSelect}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description (optional)</label>
              <input
                type="text"
                className="form-control"
                value={fileDescription}
                onChange={(e) => setFileDescription(e.target.value)}
                placeholder="Describe this file..."
              />
            </div>

            <div className="form-group">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isPublic">
                  Public (visible to all task members)
                </label>
              </div>
            </div>

            <div className="upload-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowUpload(false)}
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="attachments-list">
        {loading ? (
          <div className="loading">Loading attachments...</div>
        ) : attachments.length === 0 ? (
          <div className="no-attachments">
            <p className="text-muted">No attachments yet</p>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info">
                <div className="attachment-icon">
                  {getFileIcon(attachment.file_type)}
                </div>
                <div className="attachment-details">
                  <div className="attachment-name">
                    <a 
                      href={attachment.file_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {attachment.original_name}
                    </a>
                  </div>
                  <div className="attachment-meta">
                    <span className="file-size">{formatFileSize(attachment.file_size)}</span>
                    <span className="upload-date">
                      {new Date(attachment.created_at).toLocaleDateString()}
                    </span>
                    <span className="uploader">
                      by {attachment.uploader_first_name} {attachment.uploader_last_name}
                    </span>
                  </div>
                  {attachment.description && (
                    <div className="attachment-description">
                      {attachment.description}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="attachment-actions">
                <a 
                  href={attachment.file_path} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  Download
                </a>
                {attachment.user_id === permissions?.userId && (
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(attachment.id, attachment.original_name)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskAttachments;
```

### **5. Task Members Component**

```javascript
// src/components/TaskView/TaskMembers.jsx
import React, { useState } from 'react';
import { useTaskMembers } from '../../hooks/useTaskMembers';
import { toast } from 'react-toastify';

const TaskMembers = ({ taskId, members: initialMembers, permissions }) => {
  const {
    members,
    loading,
    error,
    addMember,
    updateMember,
    removeMember,
    searchUsers,
    refresh
  } = useTaskMembers(taskId);

  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [memberRole, setMemberRole] = useState('member');
  const [memberPermissions, setMemberPermissions] = useState({
    can_edit: true,
    can_comment: true,
    can_upload: true
  });

  const canManageMembers = permissions?.isOwner || permissions?.role === 'admin';

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const users = await searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await addMember(selectedUser.id, memberRole, memberPermissions);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddMember(false);
      toast.success('Member added successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    try {
      await updateMember(memberId, updates);
      toast.success('Member updated successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from this task?`)) return;

    try {
      await removeMember(memberId);
      toast.success('Member removed successfully');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner': return 'badge-primary';
      case 'admin': return 'badge-success';
      case 'member': return 'badge-info';
      case 'viewer': return 'badge-secondary';
      default: return 'badge-light';
    }
  };

  if (error) {
    return (
      <div className="task-members">
        <div className="members-error">
          <p>Error loading members: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-members">
      <div className="members-header">
        <h3>Task Members</h3>
        <div className="members-actions">
          <span className="member-count">{members.length} members</span>
          {canManageMembers && (
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowAddMember(!showAddMember)}
            >
              Add Member
            </button>
          )}
        </div>
      </div>

      {showAddMember && canManageMembers && (
        <div className="add-member-form">
          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label>Search Users</label>
              <input
                type="text"
                className="form-control"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                placeholder="Search by name or email..."
              />
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((user) => (
                    <div 
                      key={user.id} 
                      className={`search-result-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="user-info">
                        <strong>{user.first_name} {user.last_name}</strong>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUser && (
              <>
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    className="form-control"
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Permissions</label>
                  <div className="permissions-checkboxes">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="canEdit"
                        checked={memberPermissions.can_edit}
                        onChange={(e) => setMemberPermissions(prev => ({ 
                          ...prev, 
                          can_edit: e.target.checked 
                        }))}
                      />
                      <label className="form-check-label" htmlFor="canEdit">
                        Can Edit Task
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="canComment"
                        checked={memberPermissions.can_comment}
                        onChange={(e) => setMemberPermissions(prev => ({ 
                          ...prev, 
                          can_comment: e.target.checked 
                        }))}
                      />
                      <label className="form-check-label" htmlFor="canComment">
                        Can Comment
                      </label>
                    </div>
                    
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="canUpload"
                        checked={memberPermissions.can_upload}
                        onChange={(e) => setMemberPermissions(prev => ({ 
                          ...prev, 
                          can_upload: e.target.checked 
                        }))}
                      />
                      <label className="form-check-label" htmlFor="canUpload">
                        Can Upload Files
                      </label>
                    </div>
                  </div>
                </div>

                <div className="add-member-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    Add Member
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      <div className="members-list">
        {loading ? (
          <div className="loading">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="no-members">
            <p className="text-muted">No members yet</p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-info">
                <div className="member-avatar">
                  <img 
                    src={member.avatar_url || '/default-avatar.png'} 
                    alt={member.first_name}
                  />
                </div>
                <div className="member-details">
                  <div className="member-name">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="member-email">{member.email}</div>
                  <div className="member-meta">
                    <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                      {member.role}
                    </span>
                    <span className="joined-date">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {canManageMembers && member.role !== 'owner' && (
                <div className="member-actions">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      const newRole = member.role === 'admin' ? 'member' : 'admin';
                      handleUpdateMember(member.id, { role: newRole });
                    }}
                  >
                    {member.role === 'admin' ? 'Demote' : 'Promote'}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleRemoveMember(
                      member.id, 
                      `${member.first_name} ${member.last_name}`
                    )}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskMembers;
```

## 🎨 **CSS Styles**

```css
/* src/styles/TaskView.css */
.task-view-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.task-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.task-header h1 {
  margin-bottom: 10px;
  color: #333;
}

.task-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-todo { background: #e3f2fd; color: #1976d2; }
.status-in-progress { background: #fff3e0; color: #f57c00; }
.status-review { background: #f3e5f5; color: #7b1fa2; }
.status-done { background: #e8f5e8; color: #388e3c; }

.priority {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.task-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.task-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.task-sidebar {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Task Details */
.task-details {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-details-header h3 {
  margin: 0;
  color: #333;
}

.task-detail-text {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Task Chat */
.task-chat {
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
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.chat-header h3 {
  margin: 0;
  color: #333;
}

.message-count {
  font-size: 14px;
  color: #666;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding-right: 10px;
  margin-bottom: 20px;
}

.chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.message-author {
  font-weight: 600;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #666;
}

.message-edited {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.message-text {
  background: #f8f9fa;
  padding: 10px 15px;
  border-radius: 18px;
  line-height: 1.4;
}

.message-actions {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.message-actions .btn {
  padding: 2px 8px;
  font-size: 12px;
}

.chat-input {
  margin-top: auto;
}

.chat-input .input-group {
  display: flex;
  gap: 10px;
}

.chat-input .form-control {
  flex: 1;
}

/* Task Attachments */
.task-attachments {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.attachments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.attachments-header h3 {
  margin: 0;
  color: #333;
}

.attachment-count {
  font-size: 14px;
  color: #666;
}

.upload-form {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.attachment-icon {
  font-size: 24px;
}

.attachment-details {
  flex: 1;
}

.attachment-name a {
  font-weight: 600;
  color: #007bff;
  text-decoration: none;
}

.attachment-name a:hover {
  text-decoration: underline;
}

.attachment-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.attachment-description {
  font-size: 14px;
  color: #333;
  margin-top: 5px;
}

.attachment-actions {
  display: flex;
  gap: 10px;
}

/* Task Members */
.task-members {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.members-header h3 {
  margin: 0;
  color: #333;
}

.member-count {
  font-size: 14px;
  color: #666;
}

.add-member-form {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  margin-top: 10px;
}

.search-result-item {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #e9ecef;
}

.search-result-item:hover,
.search-result-item.selected {
  background: #e3f2fd;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-email {
  font-size: 12px;
  color: #666;
}

.permissions-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.member-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.member-details {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #333;
}

.member-email {
  font-size: 14px;
  color: #666;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
}

.joined-date {
  font-size: 12px;
  color: #999;
}

.member-actions {
  display: flex;
  gap: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .task-content {
    grid-template-columns: 1fr;
  }
  
  .task-sidebar {
    order: -1;
  }
  
  .task-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
```

## 🔧 **Context Provider**

```javascript
// src/contexts/TaskViewContext.js
import React, { createContext, useContext, useReducer } from 'react';

const TaskViewContext = createContext();

const taskViewReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TASK_VIEW':
      return { ...state, taskView: action.payload };
    case 'UPDATE_TASK_DETAILS':
      return {
        ...state,
        taskView: {
          ...state.taskView,
          details: { ...state.taskView.details, ...action.payload }
        }
      };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        taskView: {
          ...state.taskView,
          chat: {
            ...state.taskView.chat,
            messages: [action.payload, ...state.taskView.chat.messages]
          }
        }
      };
    case 'ADD_ATTACHMENT':
      return {
        ...state,
        taskView: {
          ...state.taskView,
          attachments: [action.payload, ...state.taskView.attachments]
        }
      };
    case 'ADD_MEMBER':
      return {
        ...state,
        taskView: {
          ...state.taskView,
          members: [...state.taskView.members, action.payload]
        }
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const TaskViewProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskViewReducer, {
    taskView: null,
    loading: false,
    error: null
  });

  return (
    <TaskViewContext.Provider value={{ state, dispatch }}>
      {children}
    </TaskViewContext.Provider>
  );
};

export const useTaskViewContext = () => {
  const context = useContext(TaskViewContext);
  if (!context) {
    throw new Error('useTaskViewContext must be used within TaskViewProvider');
  }
  return context;
};
```

## 🚀 **Usage Example**

```javascript
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskViewProvider } from './contexts/TaskViewContext';
import TaskViewPage from './components/TaskView/TaskViewPage';

function App() {
  return (
    <TaskViewProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/tasks/:taskId" element={<TaskViewPage />} />
            {/* Other routes */}
          </Routes>
        </div>
      </Router>
    </TaskViewProvider>
  );
}

export default App;
```

## 📱 **Mobile Optimization**

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
  .task-view-page {
    padding: 10px;
  }
  
  .task-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .task-sidebar {
    order: -1;
  }
  
  .chat-messages {
    max-height: 400px;
  }
  
  .attachment-item,
  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .attachment-actions,
  .member-actions {
    align-self: flex-end;
  }
}
```

## 🔐 **Permission Handling**

```javascript
// src/utils/permissions.js
export const checkPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions) return false;
  
  // Owner has all permissions
  if (userPermissions.isOwner) return true;
  
  // Check specific permission
  return userPermissions.permissions?.[requiredPermission] !== false;
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer'
  };
  return roleNames[role] || role;
};

export const canManageTask = (userPermissions) => {
  return userPermissions?.isOwner || userPermissions?.role === 'admin';
};
```

## 🎯 **Summary**

Dokumentasi ini menyediakan:

✅ **Complete API Integration** - Service layer untuk semua endpoints
✅ **Custom Hooks** - Reusable hooks untuk state management
✅ **React Components** - Complete UI components
✅ **CSS Styles** - Responsive styling
✅ **Context Provider** - Global state management
✅ **Permission System** - Role-based access control
✅ **Mobile Optimization** - Responsive design
✅ **Error Handling** - Comprehensive error management

**Frontend sekarang siap untuk mengintegrasikan semua fitur Task View yang baru!** 🎉
