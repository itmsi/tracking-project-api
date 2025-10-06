# 📋 API Documentation - Project Tracker

Sistem API untuk project tracker yang mirip dengan Trello, Jira, atau Asana. API ini menyediakan fitur lengkap untuk mengelola proyek, tugas, tim, dan kolaborasi.

## 🔧 Tech Stack

- **Backend**: Express.js
- **Database**: PostgreSQL dengan Knex.js
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Joi
- **Logging**: Winston
- **File Upload**: Multer

## 🚀 Base URL

```
http://localhost:3000/api
```

## 🔐 Authentication

Semua endpoint (kecuali auth) memerlukan token JWT di header:

```
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### 🔑 Authentication (`/api/auth`)

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user" // optional: admin, project_manager, developer, user
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "current_password": "oldpassword",
  "new_password": "newpassword",
  "confirm_password": "newpassword"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

---

### 👥 Users Management (`/api/users`)

> **Note**: Hanya admin yang dapat mengakses endpoint ini

#### Get Users List
```http
GET /api/users?page=1&limit=10&search=john&role=developer
Authorization: Bearer <admin-token>
```

#### Get User Detail
```http
GET /api/users/:id
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Smith",
  "role": "developer",
  "is_active": true
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

#### Get User Activity
```http
GET /api/users/:id/activity?page=1&limit=20&entity_type=task
Authorization: Bearer <token>
```

---

### 👨‍👩‍👧‍👦 Teams Management (`/api/teams`)

#### Get Teams List
```http
GET /api/teams?page=1&limit=10&search=frontend
Authorization: Bearer <token>
```

#### Create Team
```http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Frontend Team",
  "description": "Team untuk pengembangan frontend"
}
```

#### Get Team Detail
```http
GET /api/teams/:id
Authorization: Bearer <token>
```

#### Update Team
```http
PUT /api/teams/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Frontend Development Team",
  "description": "Updated description"
}
```

#### Delete Team
```http
DELETE /api/teams/:id
Authorization: Bearer <token>
```

#### Get Team Members
```http
GET /api/teams/:id/members
Authorization: Bearer <token>
```

#### Add Team Member
```http
POST /api/teams/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid-user-id",
  "role": "member" // owner, admin, member
}
```

#### Update Team Member Role
```http
PUT /api/teams/:id/members/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Remove Team Member
```http
DELETE /api/teams/:id/members/:userId
Authorization: Bearer <token>
```

---

### 📁 Projects Management (`/api/projects`)

#### Get Projects List
```http
GET /api/projects?page=1&limit=10&search=website&status=active&team_id=uuid
Authorization: Bearer <token>
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Redesign website perusahaan",
  "team_id": "uuid-team-id", // optional
  "start_date": "2024-01-01",
  "end_date": "2024-03-31",
  "color": "#3B82F6"
}
```

#### Get Project Detail
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

#### Update Project
```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Website Redesign v2",
  "status": "on_hold",
  "end_date": "2024-04-30"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

#### Get Project Members
```http
GET /api/projects/:id/members
Authorization: Bearer <token>
```

#### Add Project Member
```http
POST /api/projects/:id/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid-user-id",
  "role": "member" // owner, admin, member, viewer
}
```

#### Update Project Member Role
```http
PUT /api/projects/:id/members/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin"
}
```

#### Remove Project Member
```http
DELETE /api/projects/:id/members/:userId
Authorization: Bearer <token>
```

#### Get Project Statistics
```http
GET /api/projects/:id/stats
Authorization: Bearer <token>
```

---

### ✅ Tasks Management (`/api/tasks`)

#### Get Tasks List
```http
GET /api/tasks?page=1&limit=10&project_id=uuid&status=todo&priority=high&assigned_to=uuid&search=login
Authorization: Bearer <token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement Login Feature",
  "description": "Buat fitur login dengan JWT",
  "project_id": "uuid-project-id",
  "assigned_to": "uuid-user-id", // optional
  "status": "todo", // todo, in_progress, done, blocked
  "priority": "high", // low, medium, high, urgent
  "due_date": "2024-02-15",
  "parent_task_id": "uuid-parent-task", // optional for subtasks
  "checklist": [
    {
      "id": "check-1",
      "text": "Buat form login",
      "completed": false
    }
  ]
}
```

#### Get Task Detail
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement Login Feature v2",
  "status": "in_progress",
  "priority": "urgent",
  "checklist": [
    {
      "id": "check-1",
      "text": "Buat form login",
      "completed": true
    }
  ]
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

#### Update Task Status (for Kanban)
```http
PATCH /api/tasks/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "done",
  "position": 0
}
```

#### Assign Task
```http
PATCH /api/tasks/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "assigned_to": "uuid-user-id" // or null to unassign
}
```

#### Update Task Position
```http
PATCH /api/tasks/:id/position
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 2
}
```

#### Get Subtasks
```http
GET /api/tasks/:id/subtasks
Authorization: Bearer <token>
```

#### Create Subtask
```http
POST /api/tasks/:id/subtasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design Login UI",
  "description": "Buat mockup UI untuk halaman login",
  "assigned_to": "uuid-user-id",
  "priority": "medium",
  "due_date": "2024-02-10"
}
```

#### Add Task Attachment
```http
POST /api/tasks/:id/attachments
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "design.png",
  "url": "https://example.com/files/design.png",
  "size": 1024000,
  "mime_type": "image/png"
}
```

#### Remove Task Attachment
```http
DELETE /api/tasks/:id/attachments/:attachmentId
Authorization: Bearer <token>
```

---

### 💬 Comments Management (`/api/comments`)

#### Get Task Comments
```http
GET /api/comments/task/:taskId?page=1&limit=20
Authorization: Bearer <token>
```

#### Create Comment
```http
POST /api/comments/task/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Progress sudah 80% selesai",
  "parent_comment_id": "uuid-parent-comment", // optional for replies
  "attachments": [
    {
      "filename": "screenshot.png",
      "url": "https://example.com/screenshot.png",
      "size": 512000,
      "mime_type": "image/png"
    }
  ]
}
```

#### Update Comment
```http
PUT /api/comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Progress sudah 90% selesai"
}
```

#### Delete Comment
```http
DELETE /api/comments/:id
Authorization: Bearer <token>
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": {
    // response data
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## 🔒 Role-Based Access Control

### User Roles
- **admin**: Akses penuh ke semua fitur
- **project_manager**: Dapat mengelola proyek dan tim
- **developer**: Dapat mengerjakan tugas
- **user**: Akses terbatas

### Permission Matrix

| Action | Admin | Project Manager | Developer | User |
|--------|-------|-----------------|-----------|------|
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Create Teams | ✅ | ✅ | ❌ | ❌ |
| Create Projects | ✅ | ✅ | ✅ | ✅ |
| Manage Tasks | ✅ | ✅ | ✅ | ✅ |
| View All Projects | ✅ | ✅ | ❌ | ❌ |
| View Own Projects | ✅ | ✅ | ✅ | ✅ |

## 🚨 Error Codes

- **400**: Bad Request - Data tidak valid
- **401**: Unauthorized - Token tidak valid
- **403**: Forbidden - Tidak memiliki akses
- **404**: Not Found - Resource tidak ditemukan
- **500**: Internal Server Error - Server error

## 📝 Notes

1. Semua ID menggunakan UUID format
2. Tanggal menggunakan format ISO 8601 (YYYY-MM-DD)
3. File upload menggunakan URL external (S3, Cloudinary, dll)
4. Activity logs otomatis dibuat untuk semua perubahan
5. Soft delete digunakan untuk semua entity utama
6. Pagination default: page=1, limit=10
7. Search menggunakan case-insensitive partial match

## 🔧 Setup & Installation

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npm run migrate
npm run seed
```

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```
