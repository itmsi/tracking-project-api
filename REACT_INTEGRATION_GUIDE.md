# Panduan Integrasi API dengan React JS - Project Tracker

## Daftar Isi
1. [Setup Awal](#setup-awal)
2. [Struktur Folder](#struktur-folder)
3. [Konfigurasi API](#konfigurasi-api)
4. [Authentication Service](#authentication-service)
5. [API Services](#api-services)
6. [React Hooks Custom](#react-hooks-custom)
7. [Context & State Management](#context--state-management)
8. [Implementasi Komponen](#implementasi-komponen)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Setup Awal

### 1. Install Dependencies

```bash
npm install axios react-query
# atau
yarn add axios react-query
```

### 2. Environment Variables

Buat file `.env` di root project React:

```env
REACT_APP_API_BASE_URL=http://localhost:9552/api
REACT_APP_API_TIMEOUT=30000
```

---

## Struktur Folder

Struktur folder yang disarankan untuk project React:

```
src/
├── api/
│   ├── config.js              # Konfigurasi axios
│   ├── services/
│   │   ├── auth.service.js    # Auth API calls
│   │   ├── projects.service.js
│   │   ├── tasks.service.js
│   │   ├── teams.service.js
│   │   ├── comments.service.js
│   │   ├── notifications.service.js
│   │   ├── analytics.service.js
│   │   ├── calendar.service.js
│   │   ├── users.service.js
│   │   ├── settings.service.js
│   │   └── upload.service.js
│   └── interceptors.js        # Request/Response interceptors
├── hooks/
│   ├── useAuth.js
│   ├── useProjects.js
│   ├── useTasks.js
│   ├── useTeams.js
│   ├── useNotifications.js
│   └── ...
├── contexts/
│   ├── AuthContext.js
│   └── NotificationContext.js
├── utils/
│   ├── errorHandler.js
│   └── storage.js
└── components/
    └── ... (komponen UI)
```

---

## Konfigurasi API

### File: `src/api/config.js`

```javascript
import axios from 'axios';

// Konfigurasi base axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:9552/api',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - tambahkan token ke setiap request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle error globally
apiClient.interceptors.response.use(
  (response) => {
    return response.data; // Return hanya data, bukan full response
  },
  async (error) => {
    const originalRequest = error.config;

    // Jika token expired (401) dan belum retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/auth/refresh-token`,
            { refresh_token: refreshToken }
          );

          const { access_token } = response.data.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request dengan token baru
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Jika refresh token gagal, logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Authentication Service

### File: `src/api/services/auth.service.js`

```javascript
import apiClient from '../config';

const AuthService = {
  // Register user baru
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
  },

  // Login user
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    
    // Simpan token ke localStorage
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
    }
    
    return response;
  },

  // Logout user
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  // Get user profile
  getProfile: async () => {
    return await apiClient.get('/auth/me');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await apiClient.put('/auth/profile', profileData);
  },

  // Change password
  changePassword: async (passwordData) => {
    return await apiClient.put('/auth/change-password', passwordData);
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return await apiClient.post('/auth/refresh-token', { refresh_token: refreshToken });
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('access_token');
  },
};

export default AuthService;
```

---

## API Services

### File: `src/api/services/projects.service.js`

```javascript
import apiClient from '../config';

const ProjectsService = {
  // Get all projects
  getProjects: async (params = {}) => {
    return await apiClient.get('/projects', { params });
  },

  // Get project by ID
  getProject: async (id) => {
    return await apiClient.get(`/projects/${id}`);
  },

  // Create new project
  createProject: async (projectData) => {
    return await apiClient.post('/projects', projectData);
  },

  // Update project
  updateProject: async (id, projectData) => {
    return await apiClient.put(`/projects/${id}`, projectData);
  },

  // Delete project
  deleteProject: async (id) => {
    return await apiClient.delete(`/projects/${id}`);
  },

  // Get project members
  getProjectMembers: async (id) => {
    return await apiClient.get(`/projects/${id}/members`);
  },

  // Add project member
  addProjectMember: async (id, memberData) => {
    return await apiClient.post(`/projects/${id}/members`, memberData);
  },

  // Update project member
  updateProjectMember: async (id, userId, memberData) => {
    return await apiClient.put(`/projects/${id}/members/${userId}`, memberData);
  },

  // Remove project member
  removeProjectMember: async (id, userId) => {
    return await apiClient.delete(`/projects/${id}/members/${userId}`);
  },

  // Get project statistics
  getProjectStats: async (id) => {
    return await apiClient.get(`/projects/${id}/stats`);
  },
};

export default ProjectsService;
```

### File: `src/api/services/tasks.service.js`

```javascript
import apiClient from '../config';

const TasksService = {
  // Get all tasks
  getTasks: async (params = {}) => {
    return await apiClient.get('/tasks', { params });
  },

  // Get task by ID
  getTask: async (id) => {
    return await apiClient.get(`/tasks/${id}`);
  },

  // Create new task
  createTask: async (taskData) => {
    return await apiClient.post('/tasks', taskData);
  },

  // Update task
  updateTask: async (id, taskData) => {
    return await apiClient.put(`/tasks/${id}`, taskData);
  },

  // Delete task
  deleteTask: async (id) => {
    return await apiClient.delete(`/tasks/${id}`);
  },

  // Update task status (untuk kanban)
  updateTaskStatus: async (id, statusData) => {
    return await apiClient.patch(`/tasks/${id}/status`, statusData);
  },

  // Assign task to user
  assignTask: async (id, userId) => {
    return await apiClient.patch(`/tasks/${id}/assign`, { assigned_to: userId });
  },

  // Update task position
  updateTaskPosition: async (id, position) => {
    return await apiClient.patch(`/tasks/${id}/position`, { position });
  },

  // Get subtasks
  getSubtasks: async (id) => {
    return await apiClient.get(`/tasks/${id}/subtasks`);
  },

  // Create subtask
  createSubtask: async (id, subtaskData) => {
    return await apiClient.post(`/tasks/${id}/subtasks`, subtaskData);
  },

  // Add attachment
  addAttachment: async (id, formData) => {
    return await apiClient.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Remove attachment
  removeAttachment: async (id, attachmentId) => {
    return await apiClient.delete(`/tasks/${id}/attachments/${attachmentId}`);
  },
};

export default TasksService;
```

### File: `src/api/services/teams.service.js`

```javascript
import apiClient from '../config';

const TeamsService = {
  // Get all teams
  getTeams: async (params = {}) => {
    return await apiClient.get('/teams', { params });
  },

  // Get team by ID
  getTeam: async (id) => {
    return await apiClient.get(`/teams/${id}`);
  },

  // Create new team
  createTeam: async (teamData) => {
    return await apiClient.post('/teams', teamData);
  },

  // Update team
  updateTeam: async (id, teamData) => {
    return await apiClient.put(`/teams/${id}`, teamData);
  },

  // Delete team
  deleteTeam: async (id) => {
    return await apiClient.delete(`/teams/${id}`);
  },

  // Get team members
  getTeamMembers: async (id) => {
    return await apiClient.get(`/teams/${id}/members`);
  },

  // Add team member
  addTeamMember: async (id, memberData) => {
    return await apiClient.post(`/teams/${id}/members`, memberData);
  },

  // Update team member
  updateTeamMember: async (id, userId, memberData) => {
    return await apiClient.put(`/teams/${id}/members/${userId}`, memberData);
  },

  // Remove team member
  removeTeamMember: async (id, userId) => {
    return await apiClient.delete(`/teams/${id}/members/${userId}`);
  },
};

export default TeamsService;
```

### File: `src/api/services/comments.service.js`

```javascript
import apiClient from '../config';

const CommentsService = {
  // Get comments
  getComments: async (params = {}) => {
    return await apiClient.get('/comments', { params });
  },

  // Create comment
  createComment: async (commentData) => {
    return await apiClient.post('/comments', commentData);
  },

  // Update comment
  updateComment: async (id, commentData) => {
    return await apiClient.put(`/comments/${id}`, commentData);
  },

  // Delete comment
  deleteComment: async (id) => {
    return await apiClient.delete(`/comments/${id}`);
  },
};

export default CommentsService;
```

### File: `src/api/services/notifications.service.js`

```javascript
import apiClient from '../config';

const NotificationsService = {
  // Get notifications
  getNotifications: async (params = {}) => {
    return await apiClient.get('/notifications', { params });
  },

  // Mark notification as read
  markAsRead: async (id) => {
    return await apiClient.patch(`/notifications/${id}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return await apiClient.patch('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: async (id) => {
    return await apiClient.delete(`/notifications/${id}`);
  },

  // Get unread count
  getUnreadCount: async () => {
    return await apiClient.get('/notifications/unread-count');
  },
};

export default NotificationsService;
```

### File: `src/api/services/analytics.service.js`

```javascript
import apiClient from '../config';

const AnalyticsService = {
  // Get dashboard analytics
  getDashboard: async (params = {}) => {
    return await apiClient.get('/analytics/dashboard', { params });
  },

  // Get project analytics
  getProjects: async (params = {}) => {
    return await apiClient.get('/analytics/projects', { params });
  },

  // Get task analytics
  getTasks: async (params = {}) => {
    return await apiClient.get('/analytics/tasks', { params });
  },

  // Get team analytics
  getTeams: async (params = {}) => {
    return await apiClient.get('/analytics/teams', { params });
  },
};

export default AnalyticsService;
```

### File: `src/api/services/calendar.service.js`

```javascript
import apiClient from '../config';

const CalendarService = {
  // Get calendar events
  getEvents: async (params = {}) => {
    return await apiClient.get('/calendar/events', { params });
  },

  // Get upcoming events
  getUpcomingEvents: async () => {
    return await apiClient.get('/calendar/events/upcoming');
  },

  // Create calendar event
  createEvent: async (eventData) => {
    return await apiClient.post('/calendar/events', eventData);
  },

  // Update calendar event
  updateEvent: async (id, eventData) => {
    return await apiClient.put(`/calendar/events/${id}`, eventData);
  },

  // Delete calendar event
  deleteEvent: async (id) => {
    return await apiClient.delete(`/calendar/events/${id}`);
  },
};

export default CalendarService;
```

### File: `src/api/services/users.service.js`

```javascript
import apiClient from '../config';

const UsersService = {
  // Get all users
  getUsers: async (params = {}) => {
    return await apiClient.get('/users', { params });
  },

  // Get user by ID
  getUser: async (id) => {
    return await apiClient.get(`/users/${id}`);
  },

  // Update user (admin only)
  updateUser: async (id, userData) => {
    return await apiClient.put(`/users/${id}`, userData);
  },

  // Delete user (admin only)
  deleteUser: async (id) => {
    return await apiClient.delete(`/users/${id}`);
  },

  // Get user activity
  getUserActivity: async (id) => {
    return await apiClient.get(`/users/${id}/activity`);
  },
};

export default UsersService;
```

### File: `src/api/services/settings.service.js`

```javascript
import apiClient from '../config';

const SettingsService = {
  // Get user settings
  getUserSettings: async () => {
    return await apiClient.get('/settings');
  },

  // Update user settings
  updateUserSettings: async (settingsData) => {
    return await apiClient.put('/settings', settingsData);
  },

  // Get system settings (admin only)
  getSystemSettings: async () => {
    return await apiClient.get('/settings/system');
  },

  // Update system settings (admin only)
  updateSystemSettings: async (settingsData) => {
    return await apiClient.put('/settings/system', settingsData);
  },

  // Get user preferences
  getUserPreferences: async () => {
    return await apiClient.get('/settings/preferences');
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    return await apiClient.get('/settings/notifications');
  },

  // Get dashboard preferences
  getDashboardPreferences: async () => {
    return await apiClient.get('/settings/dashboard');
  },

  // Get privacy preferences
  getPrivacyPreferences: async () => {
    return await apiClient.get('/settings/privacy');
  },
};

export default SettingsService;
```

### File: `src/api/services/upload.service.js`

```javascript
import apiClient from '../config';

const UploadService = {
  // Upload file
  uploadFile: async (formData) => {
    return await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Get files
  getFiles: async (params = {}) => {
    return await apiClient.get('/upload', { params });
  },

  // Delete file
  deleteFile: async (id) => {
    return await apiClient.delete(`/upload/${id}`);
  },

  // Get file statistics
  getFileStats: async () => {
    return await apiClient.get('/upload/stats');
  },

  // Get file usage by project
  getFileUsageByProject: async () => {
    return await apiClient.get('/upload/usage/projects');
  },

  // Get file usage by task
  getFileUsageByTask: async () => {
    return await apiClient.get('/upload/usage/tasks');
  },
};

export default UploadService;
```

---

## React Hooks Custom

### File: `src/hooks/useAuth.js`

```javascript
import { useState, useEffect } from 'react';
import AuthService from '../api/services/auth.service';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile saat hook pertama kali digunakan
  useEffect(() => {
    const loadUser = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const response = await AuthService.getProfile();
          setUser(response.data);
        } catch (err) {
          console.error('Failed to load user:', err);
          setError(err);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.login(credentials);
      setUser(response.data.user);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.register(userData);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.updateProfile(profileData);
      setUser(response.data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.changePassword(passwordData);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
  };
};
```

### File: `src/hooks/useProjects.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import ProjectsService from '../api/services/projects.service';

export const useProjects = (params = {}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProjectsService.getProjects(params);
      setProjects(response.data.items || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Create project
  const createProject = async (projectData) => {
    try {
      const response = await ProjectsService.createProject(projectData);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Update project
  const updateProject = async (id, projectData) => {
    try {
      const response = await ProjectsService.updateProject(id, projectData);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Delete project
  const deleteProject = async (id) => {
    try {
      const response = await ProjectsService.deleteProject(id);
      await fetchProjects(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    pagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};

// Hook untuk single project
export const useProject = (id) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await ProjectsService.getProject(id);
      setProject(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
};
```

### File: `src/hooks/useTasks.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import TasksService from '../api/services/tasks.service';

export const useTasks = (params = {}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await TasksService.getTasks(params);
      setTasks(response.data.items || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create task
  const createTask = async (taskData) => {
    try {
      const response = await TasksService.createTask(taskData);
      await fetchTasks(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Update task
  const updateTask = async (id, taskData) => {
    try {
      const response = await TasksService.updateTask(id, taskData);
      await fetchTasks(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      const response = await TasksService.deleteTask(id);
      await fetchTasks(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Update task status (untuk kanban)
  const updateTaskStatus = async (id, statusData) => {
    try {
      const response = await TasksService.updateTaskStatus(id, statusData);
      await fetchTasks(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  // Assign task
  const assignTask = async (id, userId) => {
    try {
      const response = await TasksService.assignTask(id, userId);
      await fetchTasks(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
  };
};
```

### File: `src/hooks/useNotifications.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import NotificationsService from '../api/services/notifications.service';

export const useNotifications = (params = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotificationsService.getNotifications(params);
      setNotifications(response.data.items || response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await NotificationsService.getUnreadCount();
      setUnreadCount(response.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll unread count setiap 30 detik
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await NotificationsService.markAsRead(id);
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      throw err;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await NotificationsService.markAllAsRead();
      await fetchNotifications();
      setUnreadCount(0);
    } catch (err) {
      throw err;
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await NotificationsService.deleteNotification(id);
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (err) {
      throw err;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
};
```

---

## Context & State Management

### File: `src/contexts/AuthContext.js`

```javascript
import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
```

### File: `src/contexts/NotificationContext.js`

```javascript
import React, { createContext, useContext } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};
```

---

## Implementasi Komponen

### 1. Setup Context di Root App

**File: `src/App.js`**

```javascript
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Routes from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 2. Login Component

**File: `src/components/Auth/LoginForm.jsx`**

```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthContext();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;
```

### 3. Projects List Component

**File: `src/components/Projects/ProjectsList.jsx`**

```javascript
import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';

const ProjectsList = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const { 
    projects, 
    loading, 
    error, 
    pagination,
    createProject,
    deleteProject 
  } = useProjects({ 
    page, 
    limit: 10,
    ...filters 
  });

  const handleCreateProject = async (projectData) => {
    try {
      await createProject(projectData);
      alert('Project created successfully!');
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteProject(id);
        alert('Project deleted successfully!');
      } catch (err) {
        alert('Failed to delete project');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Projects</h1>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Projects List */}
      <div className="projects-list">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.name}</h3>
            <p>{project.description}</p>
            <p>Status: {project.status}</p>
            <button onClick={() => handleDeleteProject(project.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button 
            disabled={page === pagination.pages} 
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
```

### 4. Kanban Board Component (Drag & Drop Tasks)

**File: `src/components/Tasks/KanbanBoard.jsx`**

```javascript
import React, { useState, useEffect } from 'react';
import TasksService from '../../api/services/tasks.service';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await TasksService.getTasks({ project_id: projectId });
      
      // Group tasks by status
      const grouped = {
        todo: [],
        in_progress: [],
        review: [],
        done: [],
      };
      
      response.data.forEach((task) => {
        if (grouped[task.status]) {
          grouped[task.status].push(task);
        }
      });
      
      setTasks(grouped);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('currentStatus', task.status);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    const taskId = e.dataTransfer.getData('taskId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    if (currentStatus === newStatus) return;

    try {
      await TasksService.updateTaskStatus(taskId, { status: newStatus });
      await fetchTasks(); // Refresh tasks
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="kanban-board">
      {Object.keys(tasks).map((status) => (
        <div
          key={status}
          className="kanban-column"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <h3>{status.replace('_', ' ').toUpperCase()}</h3>
          
          <div className="tasks-container">
            {tasks[status].map((task) => (
              <div
                key={task.id}
                className="task-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
              >
                <h4>{task.title}</h4>
                <p>{task.description}</p>
                <span className={`priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
```

### 5. Notifications Component

**File: `src/components/Notifications/NotificationBell.jsx`**

```javascript
import React, { useState } from 'react';
import { useNotificationContext } from '../../contexts/NotificationContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationContext();

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Navigate to related page
    // navigate(notification.link);
  };

  return (
    <div className="notification-bell">
      <button onClick={() => setIsOpen(!isOpen)}>
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}>Mark all as read</button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p>No notifications</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="time">{notification.created_at}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

### 6. File Upload Component

**File: `src/components/Upload/FileUpload.jsx`**

```javascript
import React, { useState } from 'react';
import UploadService from '../../api/services/upload.service';

const FileUpload = ({ type = 'avatar', onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await UploadService.uploadFile(formData);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      
      alert('File uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && <p>Uploading...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default FileUpload;
```

---

## Error Handling

### File: `src/utils/errorHandler.js`

```javascript
// Error handler utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Bad request';
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return data.message || 'Validation error';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || 'An error occurred';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Toast notification helper
export const showErrorToast = (error) => {
  const message = handleApiError(error);
  // Implementasi toast library (react-toastify, etc)
  alert(message);
};

export const showSuccessToast = (message) => {
  // Implementasi toast library
  alert(message);
};
```

---

## Best Practices

### 1. Loading States

```javascript
// Selalu tampilkan loading state
if (loading) {
  return <Spinner />;
}

// Atau dengan skeleton loader
if (loading) {
  return <SkeletonLoader />;
}
```

### 2. Error Handling

```javascript
// Selalu handle error dengan baik
if (error) {
  return (
    <ErrorMessage 
      message={handleApiError(error)} 
      onRetry={fetchData}
    />
  );
}
```

### 3. Optimistic Updates

```javascript
// Update UI terlebih dahulu, kemudian sync dengan server
const handleLike = async (id) => {
  // Update UI immediately
  setLiked(true);
  
  try {
    await api.likePost(id);
  } catch (err) {
    // Rollback on error
    setLiked(false);
    showErrorToast(err);
  }
};
```

### 4. Debounce untuk Search

```javascript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const SearchComponent = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const debouncedSearch = debounce(async (query) => {
      if (query) {
        const response = await api.search(query);
        setResults(response.data);
      }
    }, 500);

    debouncedSearch(search);

    return () => debouncedSearch.cancel();
  }, [search]);

  return (
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
};
```

### 5. Pagination dengan Infinite Scroll

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';

const InfiniteScrollList = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const lastItemRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await api.getItems({ page, limit: 20 });
      setItems(prev => [...prev, ...response.data.items]);
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
      setLoading(false);
    };

    fetchData();
  }, [page]);

  return (
    <div>
      {items.map((item, index) => {
        if (items.length === index + 1) {
          return <div ref={lastItemRef} key={item.id}>{item.name}</div>;
        } else {
          return <div key={item.id}>{item.name}</div>;
        }
      })}
      {loading && <div>Loading...</div>}
    </div>
  );
};
```

### 6. Protected Routes

```javascript
// File: src/components/Auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

// Usage in routes
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## Testing API Integration

### 1. Test dengan Console

```javascript
// Di browser console atau component
import AuthService from './api/services/auth.service';

// Test login
AuthService.login({
  email: 'user@example.com',
  password: 'password123'
}).then(console.log).catch(console.error);

// Test get profile
AuthService.getProfile()
  .then(console.log)
  .catch(console.error);
```

### 2. Test dengan React Component

```javascript
// TestApiComponent.jsx
import React, { useState } from 'react';
import ProjectsService from '../api/services/projects.service';

const TestApiComponent = () => {
  const [result, setResult] = useState(null);

  const testGetProjects = async () => {
    try {
      const response = await ProjectsService.getProjects();
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setResult(JSON.stringify(err.response?.data || err, null, 2));
    }
  };

  return (
    <div>
      <button onClick={testGetProjects}>Test Get Projects</button>
      <pre>{result}</pre>
    </div>
  );
};

export default TestApiComponent;
```

---

## Troubleshooting

### 1. CORS Error

Jika muncul CORS error, pastikan backend sudah setup CORS dengan benar:

```javascript
// Backend (sudah ada di tracker-project)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 2. Token Not Sent

Pastikan token disimpan di localStorage dan interceptor berjalan:

```javascript
// Check token in console
console.log(localStorage.getItem('access_token'));

// Check interceptor
console.log(apiClient.defaults.headers);
```

### 3. 401 Unauthorized

- Pastikan token valid dan belum expired
- Check apakah refresh token logic berjalan
- Logout dan login ulang

### 4. Network Error

- Check apakah backend server running
- Check API base URL di .env
- Check network tab di browser DevTools

---

## Kesimpulan

Dokumentasi ini memberikan struktur lengkap untuk integrasi API backend dengan React frontend. Dengan mengikuti panduan ini, developer frontend dapat:

1. ✅ Setup axios dengan interceptor yang proper
2. ✅ Membuat API service layer yang clean dan maintainable
3. ✅ Menggunakan custom hooks untuk data fetching
4. ✅ Implement authentication flow dengan context
5. ✅ Handle error dengan baik
6. ✅ Implement loading states
7. ✅ Membuat komponen yang reusable

### Next Steps:
1. Install dependencies yang diperlukan
2. Setup struktur folder sesuai panduan
3. Copy paste service files dan hooks
4. Setup context providers di App.js
5. Implement komponen-komponen UI
6. Test integrasi dengan backend

### Resources:
- Axios Documentation: https://axios-http.com/
- React Query: https://tanstack.com/query/latest
- React Router: https://reactrouter.com/

Selamat coding! 🚀

