# 🚀 React.js Implementation Guide - Project Tracker API

Panduan lengkap untuk mengimplementasikan frontend React.js dengan Project Tracker API.

## 📋 Daftar Isi

1. [Setup Project](#setup-project)
2. [API Configuration](#api-configuration)
3. [Authentication](#authentication)
4. [API Services](#api-services)
5. [Components](#components)
6. [State Management](#state-management)
7. [Routing](#routing)
8. [Styling](#styling)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

## 🛠️ Setup Project

### 1. Create React App

```bash
npx create-react-app project-tracker-frontend
cd project-tracker-frontend
```

### 2. Install Dependencies

```bash
npm install axios react-router-dom @reduxjs/toolkit react-redux
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-date-pickers
npm install react-beautiful-dnd
npm install dayjs
npm install react-hook-form @hookform/resolvers yup
```

### 3. Project Structure

```
src/
├── components/
│   ├── common/
│   ├── auth/
│   ├── projects/
│   ├── tasks/
│   ├── teams/
│   └── layout/
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── projects.js
│   ├── tasks.js
│   └── teams.js
├── store/
│   ├── index.js
│   ├── authSlice.js
│   ├── projectSlice.js
│   └── taskSlice.js
├── utils/
│   ├── constants.js
│   ├── helpers.js
│   └── validation.js
├── hooks/
│   ├── useAuth.js
│   ├── useApi.js
│   └── useLocalStorage.js
└── pages/
    ├── Login.js
    ├── Dashboard.js
    ├── Projects.js
    ├── Tasks.js
    └── Teams.js
```

## ⚙️ API Configuration

### 1. API Base Configuration

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:9552/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
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

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## 🔐 Authentication

### 1. Auth Service

```javascript
// src/services/auth.js
import api from './api';

export const authService = {
  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get Profile
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update Profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Change Password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', {
      refresh_token: refreshToken
    });
    return response.data;
  }
};
```

### 2. Auth Hook

```javascript
// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await authService.getProfile();
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      setUser(response.data);
      setError(null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      setError(null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
    logout,
    register,
    isAuthenticated: !!user
  };
};
```

### 3. Login Component

```javascript
// src/components/auth/Login.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  email: yup.string().email('Email tidak valid').required('Email harus diisi'),
  password: yup.string().required('Password harus diisi')
});

const Login = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Login gagal');
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="grey.100"
    >
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Login
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            margin="normal"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;
```

## 📁 API Services

### 1. Projects Service

```javascript
// src/services/projects.js
import api from './api';

export const projectsService = {
  // Get Projects List
  getProjects: async (params = {}) => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  // Create Project
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Get Project Detail
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  // Update Project
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete Project
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // Get Project Members
  getProjectMembers: async (id) => {
    const response = await api.get(`/projects/${id}/members`);
    return response.data;
  },

  // Add Project Member
  addProjectMember: async (id, memberData) => {
    const response = await api.post(`/projects/${id}/members`, memberData);
    return response.data;
  },

  // Update Project Member
  updateProjectMember: async (id, userId, role) => {
    const response = await api.put(`/projects/${id}/members/${userId}`, { role });
    return response.data;
  },

  // Remove Project Member
  removeProjectMember: async (id, userId) => {
    const response = await api.delete(`/projects/${id}/members/${userId}`);
    return response.data;
  },

  // Get Project Statistics
  getProjectStats: async (id) => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  }
};
```

### 2. Tasks Service

```javascript
// src/services/tasks.js
import api from './api';

export const tasksService = {
  // Get Tasks List
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Create Task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Get Task Detail
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Update Task
  updateTask: async (id, taskData) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete Task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Update Task Status
  updateTaskStatus: async (id, status, position) => {
    const response = await api.patch(`/tasks/${id}/status`, { status, position });
    return response.data;
  },

  // Assign Task
  assignTask: async (id, assignedTo) => {
    const response = await api.patch(`/tasks/${id}/assign`, { assigned_to: assignedTo });
    return response.data;
  },

  // Update Task Position
  updateTaskPosition: async (id, position) => {
    const response = await api.patch(`/tasks/${id}/position`, { position });
    return response.data;
  },

  // Get Subtasks
  getSubtasks: async (id) => {
    const response = await api.get(`/tasks/${id}/subtasks`);
    return response.data;
  },

  // Create Subtask
  createSubtask: async (id, subtaskData) => {
    const response = await api.post(`/tasks/${id}/subtasks`, subtaskData);
    return response.data;
  },

  // Add Task Attachment
  addTaskAttachment: async (id, attachmentData) => {
    const response = await api.post(`/tasks/${id}/attachments`, attachmentData);
    return response.data;
  },

  // Remove Task Attachment
  removeTaskAttachment: async (id, attachmentId) => {
    const response = await api.delete(`/tasks/${id}/attachments/${attachmentId}`);
    return response.data;
  }
};
```

### 3. Comments Service

```javascript
// src/services/comments.js
import api from './api';

export const commentsService = {
  // Get Task Comments
  getComments: async (taskId, params = {}) => {
    const response = await api.get(`/comments/task/${taskId}`, { params });
    return response.data;
  },

  // Create Comment
  createComment: async (taskId, commentData) => {
    const response = await api.post(`/comments/task/${taskId}`, commentData);
    return response.data;
  },

  // Update Comment
  updateComment: async (id, commentData) => {
    const response = await api.put(`/comments/${id}`, commentData);
    return response.data;
  },

  // Delete Comment
  deleteComment: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};
```

### 4. Teams Service

```javascript
// src/services/teams.js
import api from './api';

export const teamsService = {
  // Get Teams List
  getTeams: async (params = {}) => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  // Create Team
  createTeam: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Get Team Detail
  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  // Update Team
  updateTeam: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  // Delete Team
  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  // Get Team Members
  getTeamMembers: async (id) => {
    const response = await api.get(`/teams/${id}/members`);
    return response.data;
  },

  // Add Team Member
  addTeamMember: async (id, memberData) => {
    const response = await api.post(`/teams/${id}/members`, memberData);
    return response.data;
  },

  // Update Team Member
  updateTeamMember: async (id, userId, role) => {
    const response = await api.put(`/teams/${id}/members/${userId}`, { role });
    return response.data;
  },

  // Remove Team Member
  removeTeamMember: async (id, userId) => {
    const response = await api.delete(`/teams/${id}/members/${userId}`);
    return response.data;
  }
};
```

## 🎯 Components

### 1. Kanban Board Component

```javascript
// src/components/tasks/KanbanBoard.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton
} from '@mui/material';
import { tasksService } from '../../services/tasks';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    done: [],
    blocked: []
  });

  const columns = [
    { id: 'todo', title: 'To Do', color: '#f3f4f6' },
    { id: 'in_progress', title: 'In Progress', color: '#dbeafe' },
    { id: 'done', title: 'Done', color: '#d1fae5' },
    { id: 'blocked', title: 'Blocked', color: '#fee2e2' }
  ];

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const response = await tasksService.getTasks({ project_id: projectId });
      const tasksByStatus = {
        todo: [],
        in_progress: [],
        done: [],
        blocked: []
      };

      response.data.tasks.forEach(task => {
        tasksByStatus[task.status].push(task);
      });

      setTasks(tasksByStatus);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newTasks = { ...tasks };
    const sourceTasks = Array.from(newTasks[source.droppableId]);
    const [removed] = sourceTasks.splice(source.index, 1);
    
    newTasks[source.droppableId] = sourceTasks;

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, removed);
      newTasks[source.droppableId] = sourceTasks;
    } else {
      const destinationTasks = Array.from(newTasks[destination.droppableId]);
      destinationTasks.splice(destination.index, 0, removed);
      newTasks[destination.droppableId] = destinationTasks;
    }

    setTasks(newTasks);

    try {
      await tasksService.updateTaskStatus(
        draggableId,
        destination.droppableId,
        destination.index
      );
    } catch (error) {
      console.error('Error updating task:', error);
      loadTasks(); // Reload on error
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box display="flex" gap={2} p={2}>
        {columns.map(column => (
          <Paper
            key={column.id}
            sx={{
              flex: 1,
              p: 2,
              backgroundColor: column.color,
              minHeight: 600
            }}
          >
            <Typography variant="h6" gutterBottom>
              {column.title} ({tasks[column.id].length})
            </Typography>
            
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minHeight: 500,
                    backgroundColor: snapshot.isDraggingOver ? '#e5e7eb' : 'transparent',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  {tasks[column.id].map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none'
                          }}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {task.title}
                            </Typography>
                            
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                              <Chip
                                label={task.priority}
                                size="small"
                                sx={{
                                  backgroundColor: getPriorityColor(task.priority),
                                  color: 'white'
                                }}
                              />
                              
                              {task.assigned_to && (
                                <Avatar
                                  src={task.assignee_avatar_url}
                                  sx={{ width: 24, height: 24 }}
                                >
                                  {task.assignee_first_name?.[0]}
                                </Avatar>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard;
```

### 2. Project Card Component

```javascript
// src/components/projects/ProjectCard.js
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      on_hold: 'warning',
      completed: 'info',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const handleViewTasks = () => {
    navigate(`/projects/${project.id}/tasks`);
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="h2">
            {project.name}
          </Typography>
          <Chip
            label={project.status}
            color={getStatusColor(project.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {project.description}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Typography variant="caption" color="text.secondary">
            {project.members || 0} members
          </Typography>
          
          <AvatarGroup max={3}>
            {/* Render project members avatars */}
          </AvatarGroup>
        </Box>

        {project.team_name && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            Team: {project.team_name}
          </Typography>
        )}
      </CardContent>

      <CardActions>
        <Button size="small" onClick={handleViewTasks}>
          View Tasks
        </Button>
        <Button size="small" onClick={() => onEdit(project)}>
          Edit
        </Button>
        <Button size="small" color="error" onClick={() => onDelete(project)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;
```

## 🔄 State Management (Redux Toolkit)

### 1. Auth Slice

```javascript
// src/store/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/auth';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('access_token'),
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.access_token;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

### 2. Project Slice

```javascript
// src/store/projectSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectsService } from '../services/projects';

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params = {}) => {
    const response = await projectsService.getProjects(params);
    return response.data;
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await projectsService.createProject(projectData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      });
  }
});

export const { setCurrentProject, clearError } = projectSlice.actions;
export default projectSlice.reducer;
```

## 🛣️ Routing

```javascript
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';

// Components
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tasks from './pages/Tasks';
import Teams from './pages/Teams';

// Protected Route Component
import ProtectedRoute from './components/common/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="projects/:id/tasks" element={<Tasks />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="teams" element={<Teams />} />
            </Route>
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
```

## 🎨 Styling dengan Material-UI

### 1. Theme Configuration

```javascript
// src/theme.js
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

## 🚨 Error Handling

### 1. Error Boundary

```javascript
// src/components/common/ErrorBoundary.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          bgcolor="grey.100"
        >
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              We're sorry, but something unexpected happened.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 🧪 Testing

### 1. API Service Tests

```javascript
// src/services/__tests__/auth.test.js
import { authService } from '../auth';
import api from '../api';

jest.mock('../api');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('login should call API with correct data', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          access_token: 'token123',
          user: { id: 1, email: 'test@example.com' }
        }
      }
    };

    api.post.mockResolvedValue(mockResponse);

    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await authService.login(credentials);

    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual(mockResponse.data);
  });
});
```

## 📱 Responsive Design

### 1. Mobile-First Approach

```javascript
// src/components/common/ResponsiveContainer.js
import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const ResponsiveContainer = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        px: isMobile ? 2 : 4,
        py: isMobile ? 2 : 3,
        maxWidth: '1200px',
        mx: 'auto'
      }}
    >
      {children}
    </Box>
  );
};

export default ResponsiveContainer;
```

## 🔧 Environment Configuration

```javascript
// src/config/environment.js
const config = {
  development: {
    API_BASE_URL: 'http://localhost:9552/api',
    WS_URL: 'ws://localhost:9552',
  },
  production: {
    API_BASE_URL: 'https://your-api-domain.com/api',
    WS_URL: 'wss://your-api-domain.com',
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

## 📦 Build & Deployment

### 1. Build Script

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:prod": "NODE_ENV=production npm run build",
    "preview": "serve -s build -l 3000"
  }
}
```

### 2. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🎯 Quick Start Checklist

- [ ] Setup React project dengan dependencies
- [ ] Konfigurasi API base URL (port 9552)
- [ ] Implementasi authentication flow
- [ ] Setup Redux store
- [ ] Buat komponen utama (Login, Dashboard, Projects, Tasks)
- [ ] Implementasi Kanban board dengan drag-drop
- [ ] Setup routing dengan protected routes
- [ ] Styling dengan Material-UI
- [ ] Error handling dan loading states
- [ ] Testing dan deployment

**API Base URL:** `http://localhost:9552/api`

Semua endpoint sudah siap digunakan dengan dokumentasi lengkap di file `API_DOCUMENTATION.md`!
