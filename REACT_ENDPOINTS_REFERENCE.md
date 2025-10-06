# 📋 React.js Endpoints Reference - Project Tracker API

Dokumentasi lengkap endpoint API untuk implementasi React.js frontend.

## 🌐 Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:9552/api';
```

## 🔐 Authentication Endpoints

### 1. Register User
```javascript
// POST /api/auth/register
const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'user' // optional: admin, project_manager, developer, user
    })
  });
  return response.json();
};
```

**Response:**
```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### 2. Login User
```javascript
// POST /api/auth/login
const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  return response.json();
};
```

### 3. Get Profile
```javascript
// GET /api/auth/me
const getProfile = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 4. Update Profile
```javascript
// PUT /api/auth/profile
const updateProfile = async (profileData) => {
  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      first_name: 'John',
      last_name: 'Smith',
      avatar_url: 'https://example.com/avatar.jpg'
    })
  });
  return response.json();
};
```

### 5. Change Password
```javascript
// PUT /api/auth/change-password
const changePassword = async (passwordData) => {
  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      current_password: 'oldpassword',
      new_password: 'newpassword',
      confirm_password: 'newpassword'
    })
  });
  return response.json();
};
```

### 6. Logout
```javascript
// POST /api/auth/logout
const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

## 📁 Projects Endpoints

### 1. Get Projects List
```javascript
// GET /api/projects
const getProjects = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/projects?${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};

// Usage examples:
getProjects(); // Get all projects
getProjects({ page: 1, limit: 10 }); // With pagination
getProjects({ search: 'website', status: 'active' }); // With filters
```

**Response:**
```json
{
  "success": true,
  "message": "Daftar project berhasil diambil",
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Website Redesign",
        "description": "Redesign website perusahaan",
        "status": "active",
        "start_date": "2024-01-01",
        "end_date": "2024-03-31",
        "color": "#3B82F6",
        "team_name": "Frontend Team",
        "creator_first_name": "John",
        "creator_last_name": "Doe",
        "created_at": "2024-01-01T00:00:00Z"
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

### 2. Create Project
```javascript
// POST /api/projects
const createProject = async (projectData) => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Website Redesign',
      description: 'Redesign website perusahaan',
      team_id: 'uuid-team-id', // optional
      start_date: '2024-01-01',
      end_date: '2024-03-31',
      color: '#3B82F6'
    })
  });
  return response.json();
};
```

### 3. Get Project Detail
```javascript
// GET /api/projects/:id
const getProject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 4. Update Project
```javascript
// PUT /api/projects/:id
const updateProject = async (id, projectData) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Website Redesign v2',
      status: 'on_hold',
      end_date: '2024-04-30'
    })
  });
  return response.json();
};
```

### 5. Delete Project
```javascript
// DELETE /api/projects/:id
const deleteProject = async (id) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 6. Get Project Members
```javascript
// GET /api/projects/:id/members
const getProjectMembers = async (id) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/members`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 7. Add Project Member
```javascript
// POST /api/projects/:id/members
const addProjectMember = async (id, memberData) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: 'uuid-user-id',
      role: 'member' // owner, admin, member, viewer
    })
  });
  return response.json();
};
```

### 8. Get Project Statistics
```javascript
// GET /api/projects/:id/stats
const getProjectStats = async (id) => {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

**Response:**
```json
{
  "success": true,
  "message": "Statistik project berhasil diambil",
  "data": {
    "tasks": [
      { "status": "todo", "count": "5" },
      { "status": "in_progress", "count": "3" },
      { "status": "done", "count": "12" }
    ],
    "members": 8,
    "overdue_tasks": 2
  }
}
```

## ✅ Tasks Endpoints

### 1. Get Tasks List
```javascript
// GET /api/tasks
const getTasks = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/tasks?${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};

// Usage examples:
getTasks(); // Get all tasks
getTasks({ project_id: 'uuid' }); // Get tasks for specific project
getTasks({ status: 'todo', priority: 'high' }); // With filters
getTasks({ assigned_to: 'uuid-user-id' }); // Get user's tasks
```

### 2. Create Task
```javascript
// POST /api/tasks
const createTask = async (taskData) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Implement Login Feature',
      description: 'Buat fitur login dengan JWT',
      project_id: 'uuid-project-id',
      assigned_to: 'uuid-user-id', // optional
      status: 'todo', // todo, in_progress, done, blocked
      priority: 'high', // low, medium, high, urgent
      due_date: '2024-02-15',
      parent_task_id: 'uuid-parent-task', // optional for subtasks
      checklist: [
        {
          id: 'check-1',
          text: 'Buat form login',
          completed: false
        }
      ]
    })
  });
  return response.json();
};
```

### 3. Update Task Status (Kanban)
```javascript
// PATCH /api/tasks/:id/status
const updateTaskStatus = async (id, status, position) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'done', // todo, in_progress, done, blocked
      position: 0 // optional for ordering
    })
  });
  return response.json();
};
```

### 4. Assign Task
```javascript
// PATCH /api/tasks/:id/assign
const assignTask = async (id, assignedTo) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/assign`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assigned_to: 'uuid-user-id' // or null to unassign
    })
  });
  return response.json();
};
```

### 5. Get Subtasks
```javascript
// GET /api/tasks/:id/subtasks
const getSubtasks = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/subtasks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 6. Create Subtask
```javascript
// POST /api/tasks/:id/subtasks
const createSubtask = async (id, subtaskData) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}/subtasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Design Login UI',
      description: 'Buat mockup UI untuk halaman login',
      assigned_to: 'uuid-user-id',
      priority: 'medium',
      due_date: '2024-02-10'
    })
  });
  return response.json();
};
```

## 💬 Comments Endpoints

### 1. Get Task Comments
```javascript
// GET /api/comments/task/:taskId
const getComments = async (taskId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/comments/task/${taskId}?${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 2. Create Comment
```javascript
// POST /api/comments/task/:taskId
const createComment = async (taskId, commentData) => {
  const response = await fetch(`${API_BASE_URL}/comments/task/${taskId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Progress sudah 80% selesai',
      parent_comment_id: 'uuid-parent-comment', // optional for replies
      attachments: [
        {
          filename: 'screenshot.png',
          url: 'https://example.com/screenshot.png',
          size: 512000,
          mime_type: 'image/png'
        }
      ]
    })
  });
  return response.json();
};
```

## 👥 Teams Endpoints

### 1. Get Teams List
```javascript
// GET /api/teams
const getTeams = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/teams?${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

### 2. Create Team
```javascript
// POST /api/teams
const createTeam = async (teamData) => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Frontend Team',
      description: 'Team untuk pengembangan frontend'
    })
  });
  return response.json();
};
```

### 3. Get Team Members
```javascript
// GET /api/teams/:id/members
const getTeamMembers = async (id) => {
  const response = await fetch(`${API_BASE_URL}/teams/${id}/members`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

## 👤 Users Endpoints (Admin Only)

### 1. Get Users List
```javascript
// GET /api/users
const getUsers = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/users?${queryString}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json',
    }
  });
  return response.json();
};
```

## 🔧 React Hook Examples

### 1. Custom Hook untuk API Calls
```javascript
// src/hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};
```

### 2. Usage dalam Component
```javascript
// src/components/ProjectsList.js
import React from 'react';
import { useApi } from '../hooks/useApi';
import { getProjects } from '../services/projects';

const ProjectsList = () => {
  const { data, loading, error } = useApi(() => getProjects({ page: 1, limit: 10 }));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data?.projects?.map(project => (
        <div key={project.id}>
          <h3>{project.name}</h3>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
};
```

## 🚨 Error Handling

### 1. Global Error Handler
```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        break;
      case 403:
        return 'Tidak memiliki akses untuk melakukan aksi ini';
      case 404:
        return 'Data tidak ditemukan';
      case 500:
        return 'Terjadi kesalahan server';
      default:
        return data?.message || 'Terjadi kesalahan';
    }
  } else if (error.request) {
    // Network error
    return 'Tidak dapat terhubung ke server';
  } else {
    // Other error
    return error.message || 'Terjadi kesalahan tidak diketahui';
  }
};
```

## 📱 Mobile-First API Calls

### 1. Responsive API Service
```javascript
// src/services/mobileApi.js
import { Platform } from 'react-native'; // if using React Native

const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:9552/api';
  } else {
    // For mobile apps, use your server's IP
    return 'http://192.168.1.100:9552/api';
  }
};

export const mobileApi = {
  baseURL: getApiBaseUrl(),
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
```

## 🎯 Quick Implementation Checklist

- [ ] Setup API base URL: `http://localhost:9552/api`
- [ ] Implement authentication flow (login/register)
- [ ] Setup JWT token storage dan headers
- [ ] Create API service functions
- [ ] Implement error handling
- [ ] Setup loading states
- [ ] Create reusable hooks
- [ ] Implement pagination
- [ ] Add search dan filtering
- [ ] Setup real-time updates (optional)

**Semua endpoint sudah siap digunakan dengan port 9552!** 🚀
