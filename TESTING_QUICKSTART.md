# Quick Start - Testing API Module Baru

Panduan cepat untuk testing module-module API yang baru dibuat.

## 📋 Module yang Akan Ditest

### Module Baru (Prioritas Testing):
1. ✅ **Teams** - Team management API
2. ✅ **Comments** - Comment system API
3. ✅ **Notifications** - Notification system API
4. ✅ **Analytics** - Analytics & reporting API
5. ✅ **Calendar** - Calendar events API
6. ✅ **Users** - User management API
7. ✅ **Settings** - User & system settings API
8. ✅ **Upload** - File upload management API

### Module yang Diupdate:
1. ✅ **Auth** - Authentication API (updated)
2. ✅ **Tasks** - Tasks API (added subtasks & attachments)

---

## 🚀 Setup Sebelum Testing

### 1. Pastikan Database Berjalan

```bash
# Check PostgreSQL
psql -U postgres -c "SELECT version();"

# Atau check dengan docker (jika menggunakan docker)
docker ps | grep postgres
```

### 2. Jalankan Migrations

```bash
cd /Users/falaqmsi/Documents/GitHub/tracker-project

# Jalankan migrations
npm run migrate

# Atau rollback dulu jika perlu
# npm run migrate:rollback
# npm run migrate
```

### 3. Jalankan Server

**Terminal 1 - Server:**
```bash
cd /Users/falaqmsi/Documents/GitHub/tracker-project

# Development mode (dengan nodemon)
npm run dev

# Atau production mode
# npm start
```

Tunggu hingga server berjalan di `http://localhost:9552`

### 4. Jalankan Testing Script

**Terminal 2 - Testing:**
```bash
cd /Users/falaqmsi/Documents/GitHub/tracker-project

# Jalankan automated testing
./scripts/test-api.sh
```

---

## 🧪 Manual Testing - Langkah per Langkah

Jika ingin testing manual, ikuti langkah berikut:

### Step 1: Register & Login

```bash
# Set base URL
export API_BASE_URL="http://localhost:9552/api"

# Register user baru
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testapi@example.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "API",
    "role": "user"
  }'

# Login
LOGIN_RESPONSE=$(curl -s -X POST $API_BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testapi@example.com",
    "password": "Test123456"
  }')

echo $LOGIN_RESPONSE

# Extract token (dengan jq)
export TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
echo "Token: $TOKEN"
```

### Step 2: Test Teams Module (BARU)

```bash
# Create Team
TEAM_RESPONSE=$(curl -s -X POST $API_BASE_URL/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Backend Team",
    "description": "Team untuk pengembangan backend",
    "status": "active"
  }')

echo $TEAM_RESPONSE | jq '.'

# Extract Team ID
export TEAM_ID=$(echo $TEAM_RESPONSE | jq -r '.data.id')

# Get Teams List
curl -X GET "$API_BASE_URL/teams?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get Team Detail
curl -X GET $API_BASE_URL/teams/$TEAM_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 3: Test Comments Module (BARU)

```bash
# Buat project dulu
PROJECT_RESPONSE=$(curl -s -X POST $API_BASE_URL/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "For testing",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }')

export PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id')

# Buat task
TASK_RESPONSE=$(curl -s -X POST $API_BASE_URL/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Task\",
    \"description\": \"For testing comments\",
    \"status\": \"todo\",
    \"priority\": \"medium\",
    \"project_id\": \"$PROJECT_ID\"
  }")

export TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.id')

# Create Comment
curl -X POST $API_BASE_URL/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"Great work on this task!\",
    \"task_id\": \"$TASK_ID\",
    \"project_id\": \"$PROJECT_ID\"
  }" | jq '.'

# Get Comments
curl -X GET "$API_BASE_URL/comments?task_id=$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 4: Test Notifications Module (BARU)

```bash
# Get All Notifications
curl -X GET "$API_BASE_URL/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get Unread Count
curl -X GET $API_BASE_URL/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Mark All as Read
curl -X PATCH $API_BASE_URL/notifications/read-all \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 5: Test Analytics Module (BARU)

```bash
# Dashboard Analytics
curl -X GET "$API_BASE_URL/analytics/dashboard?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Project Analytics
curl -X GET "$API_BASE_URL/analytics/projects?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Task Analytics
curl -X GET "$API_BASE_URL/analytics/tasks?project_id=$PROJECT_ID&period=week" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Team Analytics
curl -X GET "$API_BASE_URL/analytics/teams?team_id=$TEAM_ID&period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 6: Test Calendar Module (BARU)

```bash
# Create Calendar Event
EVENT_RESPONSE=$(curl -s -X POST $API_BASE_URL/calendar/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Sprint Planning\",
    \"description\": \"Plan sprint activities\",
    \"start_date\": \"2024-12-20T09:00:00Z\",
    \"end_date\": \"2024-12-20T10:00:00Z\",
    \"type\": \"meeting\",
    \"project_id\": \"$PROJECT_ID\"
  }")

echo $EVENT_RESPONSE | jq '.'

# Get Calendar Events
curl -X GET "$API_BASE_URL/calendar/events?start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get Upcoming Events
curl -X GET $API_BASE_URL/calendar/events/upcoming \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 7: Test Users Module (BARU)

```bash
# Get All Users
curl -X GET "$API_BASE_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Search Users
curl -X GET "$API_BASE_URL/users?search=test" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get User Detail
USER_ID=$(curl -s -X GET $API_BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.id')

curl -X GET $API_BASE_URL/users/$USER_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 8: Test Settings Module (BARU)

```bash
# Get User Settings
curl -X GET $API_BASE_URL/settings \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Update User Settings
curl -X PUT $API_BASE_URL/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "id",
    "notifications": {
      "email": true,
      "push": false,
      "task_assigned": true
    },
    "timezone": "Asia/Jakarta"
  }' | jq '.'

# Get Preferences
curl -X GET $API_BASE_URL/settings/preferences \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 9: Test Upload Module (BARU)

```bash
# Create test file
echo "This is a test file for upload" > /tmp/test-file.txt

# Upload File
curl -X POST $API_BASE_URL/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "type=task_attachment" | jq '.'

# Get File Stats
curl -X GET $API_BASE_URL/upload/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Get Files List
curl -X GET "$API_BASE_URL/upload?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Step 10: Test Tasks Updates (UPDATED)

```bash
# Create Subtask
curl -X POST $API_BASE_URL/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Subtask 1",
    "description": "First subtask",
    "priority": "high"
  }' | jq '.'

# Get Subtasks
curl -X GET $API_BASE_URL/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Add Attachment
curl -X POST $API_BASE_URL/tasks/$TASK_ID/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/test-file.txt" \
  -F "description=Task documentation" | jq '.'
```

---

## ✅ Checklist Testing

Gunakan checklist ini untuk memastikan semua endpoint berfungsi:

### Auth Module
- [ ] Register user baru
- [ ] Login dan dapat token
- [ ] Get user profile
- [ ] Update profile
- [ ] Change password

### Projects Module
- [ ] Create project
- [ ] Get projects list
- [ ] Get project detail
- [ ] Update project
- [ ] Get project stats
- [ ] Get project members

### Tasks Module
- [ ] Create task
- [ ] Get tasks list
- [ ] Update task
- [ ] Update task status
- [ ] Assign task
- [ ] Create subtask (**BARU**)
- [ ] Get subtasks (**BARU**)
- [ ] Add attachment (**BARU**)

### Teams Module (**BARU**)
- [ ] Create team
- [ ] Get teams list
- [ ] Get team detail
- [ ] Update team
- [ ] Get team members
- [ ] Add team member
- [ ] Remove team member

### Comments Module (**BARU**)
- [ ] Create comment
- [ ] Get comments by task
- [ ] Get comments by project
- [ ] Update comment
- [ ] Delete comment

### Notifications Module (**BARU**)
- [ ] Get notifications
- [ ] Get unread count
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification

### Analytics Module (**BARU**)
- [ ] Get dashboard analytics
- [ ] Get project analytics
- [ ] Get task analytics
- [ ] Get team analytics

### Calendar Module (**BARU**)
- [ ] Create event
- [ ] Get events
- [ ] Get upcoming events
- [ ] Update event
- [ ] Delete event

### Users Module (**BARU**)
- [ ] Get users list
- [ ] Search users
- [ ] Get user detail
- [ ] Get user activity

### Settings Module (**BARU**)
- [ ] Get user settings
- [ ] Update user settings
- [ ] Get preferences
- [ ] Get notification preferences

### Upload Module (**BARU**)
- [ ] Upload file
- [ ] Get files list
- [ ] Get file stats
- [ ] Delete file

---

## 🐛 Troubleshooting

### Server tidak bisa start
```bash
# Check port 9552 sudah digunakan atau belum
lsof -i :9552

# Kill process jika perlu
kill -9 <PID>

# Start ulang server
npm run dev
```

### Database connection error
```bash
# Check PostgreSQL running
pg_isready

# Restart PostgreSQL
brew services restart postgresql@14
# atau
sudo systemctl restart postgresql
```

### Migration error
```bash
# Rollback semua migrations
npm run migrate:rollback

# Jalankan ulang
npm run migrate
```

### Token expired
```bash
# Login ulang untuk mendapatkan token baru
# Ulangi Step 1 di manual testing
```

---

## 📊 Expected Results

### Success Response Format:
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

### Error Response Format:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Error details"
}
```

### Status Codes:
- `200` - Success (GET, PUT, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## 📝 Monitoring Testing

Monitor logs saat testing:

```bash
# Terminal 3 - Logs
tail -f /Users/falaqmsi/Documents/GitHub/tracker-project/logs/application/*.log
```

---

## 🎉 Selesai!

Setelah semua test berhasil, Anda bisa:
1. ✅ Commit changes ke git
2. ✅ Deploy ke server
3. ✅ Integrasikan dengan frontend React
4. ✅ Dokumentasi API selesai

**Happy Testing! 🚀**

