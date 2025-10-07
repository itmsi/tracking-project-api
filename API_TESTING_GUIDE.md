# Panduan Testing API - Project Tracker

## Daftar Isi
1. [Setup Testing](#setup-testing)
2. [Authentication & Setup](#authentication--setup)
3. [Test Module Auth](#test-module-auth)
4. [Test Module Projects](#test-module-projects)
5. [Test Module Tasks](#test-module-tasks)
6. [Test Module Teams](#test-module-teams)
7. [Test Module Comments](#test-module-comments)
8. [Test Module Notifications](#test-module-notifications)
9. [Test Module Analytics](#test-module-analytics)
10. [Test Module Calendar](#test-module-calendar)
11. [Test Module Users](#test-module-users)
12. [Test Module Settings](#test-module-settings)
13. [Test Module Upload](#test-module-upload)
14. [Automated Testing Script](#automated-testing-script)

---

## Setup Testing

### Prerequisites
1. Pastikan backend server berjalan di `http://localhost:9552`
2. Install `jq` untuk parsing JSON (optional tapi recommended):
   ```bash
   # MacOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

### Environment Variables untuk Testing
```bash
export API_BASE_URL="http://localhost:9552/api"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="Test123456"
export ACCESS_TOKEN=""
```

---

## Authentication & Setup

### 1. Register Test User

```bash
curl -X POST $API_BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "first_name": "Test",
    "last_name": "User",
    "role": "user"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user_id",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
  }
}
```

### 2. Login & Get Token

```bash
# Login
RESPONSE=$(curl -s -X POST $API_BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }')

echo $RESPONSE | jq '.'

# Extract token (gunakan jq)
export ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.access_token')
echo "Token: $ACCESS_TOKEN"
```

---

## Test Module Auth

### ✅ Test 1: Get User Profile

```bash
curl -X GET $API_BASE_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, user data

### ✅ Test 2: Update Profile

```bash
curl -X PUT $API_BASE_URL/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test Updated",
    "last_name": "User Updated"
  }' | jq '.'
```

**Expected:** Status 200, updated user data

### ✅ Test 3: Change Password

```bash
curl -X PUT $API_BASE_URL/auth/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "Test123456",
    "new_password": "NewTest123456",
    "confirm_password": "NewTest123456"
  }' | jq '.'
```

**Expected:** Status 200, password changed

### ❌ Test 4: Login dengan Password Salah (Negative Test)

```bash
curl -X POST $API_BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' | jq '.'
```

**Expected:** Status 401, error message

---

## Test Module Projects

### ✅ Test 1: Create Project

```bash
PROJECT_RESPONSE=$(curl -s -X POST $API_BASE_URL/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "This is a test project",
    "status": "active",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31",
    "color": "#3f51b5"
  }')

echo $PROJECT_RESPONSE | jq '.'

# Extract project ID
export PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id')
echo "Project ID: $PROJECT_ID"
```

**Expected:** Status 200, project created

### ✅ Test 2: Get All Projects

```bash
curl -X GET "$API_BASE_URL/projects?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of projects

### ✅ Test 3: Get Project by ID

```bash
curl -X GET $API_BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, project details

### ✅ Test 4: Update Project

```bash
curl -X PUT $API_BASE_URL/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project Updated",
    "description": "Updated description",
    "status": "in_progress"
  }' | jq '.'
```

**Expected:** Status 200, project updated

### ✅ Test 5: Get Project Stats

```bash
curl -X GET $API_BASE_URL/projects/$PROJECT_ID/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, project statistics

### ✅ Test 6: Get Project Members

```bash
curl -X GET $API_BASE_URL/projects/$PROJECT_ID/members \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of members

---

## Test Module Tasks

### ✅ Test 1: Create Task

```bash
TASK_RESPONSE=$(curl -s -X POST $API_BASE_URL/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Task\",
    \"description\": \"This is a test task\",
    \"status\": \"todo\",
    \"priority\": \"medium\",
    \"project_id\": \"$PROJECT_ID\",
    \"due_date\": \"2024-12-31\"
  }")

echo $TASK_RESPONSE | jq '.'

# Extract task ID
export TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.id')
echo "Task ID: $TASK_ID"
```

**Expected:** Status 200, task created

### ✅ Test 2: Get All Tasks

```bash
curl -X GET "$API_BASE_URL/tasks?project_id=$PROJECT_ID&page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of tasks

### ✅ Test 3: Get Task by ID

```bash
curl -X GET $API_BASE_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, task details

### ✅ Test 4: Update Task

```bash
curl -X PUT $API_BASE_URL/tasks/$TASK_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task Updated",
    "description": "Updated description",
    "priority": "high"
  }' | jq '.'
```

**Expected:** Status 200, task updated

### ✅ Test 5: Update Task Status (Kanban)

```bash
curl -X PATCH $API_BASE_URL/tasks/$TASK_ID/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "position": 1
  }' | jq '.'
```

**Expected:** Status 200, task status updated

### ✅ Test 6: Assign Task

```bash
curl -X PATCH $API_BASE_URL/tasks/$TASK_ID/assign \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": null
  }' | jq '.'
```

**Expected:** Status 200, task assigned

### ✅ Test 7: Create Subtask

```bash
SUBTASK_RESPONSE=$(curl -s -X POST $API_BASE_URL/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Subtask",
    "description": "This is a subtask",
    "priority": "low"
  }')

echo $SUBTASK_RESPONSE | jq '.'

export SUBTASK_ID=$(echo $SUBTASK_RESPONSE | jq -r '.data.id')
```

**Expected:** Status 200, subtask created

### ✅ Test 8: Get Subtasks

```bash
curl -X GET $API_BASE_URL/tasks/$TASK_ID/subtasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of subtasks

---

## Test Module Teams

### ✅ Test 1: Create Team

```bash
TEAM_RESPONSE=$(curl -s -X POST $API_BASE_URL/teams \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend Team",
    "description": "Team untuk pengembangan frontend",
    "status": "active"
  }')

echo $TEAM_RESPONSE | jq '.'

export TEAM_ID=$(echo $TEAM_RESPONSE | jq -r '.data.id')
echo "Team ID: $TEAM_ID"
```

**Expected:** Status 200, team created

### ✅ Test 2: Get All Teams

```bash
curl -X GET "$API_BASE_URL/teams?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of teams

### ✅ Test 3: Get Team by ID

```bash
curl -X GET $API_BASE_URL/teams/$TEAM_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, team details

### ✅ Test 4: Update Team

```bash
curl -X PUT $API_BASE_URL/teams/$TEAM_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Frontend Team Updated",
    "description": "Updated description"
  }' | jq '.'
```

**Expected:** Status 200, team updated

### ✅ Test 5: Get Team Members

```bash
curl -X GET $API_BASE_URL/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of team members

---

## Test Module Comments

### ✅ Test 1: Create Comment

```bash
COMMENT_RESPONSE=$(curl -s -X POST $API_BASE_URL/comments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"content\": \"This is a test comment\",
    \"task_id\": \"$TASK_ID\",
    \"project_id\": \"$PROJECT_ID\"
  }")

echo $COMMENT_RESPONSE | jq '.'

export COMMENT_ID=$(echo $COMMENT_RESPONSE | jq -r '.data.id')
echo "Comment ID: $COMMENT_ID"
```

**Expected:** Status 200, comment created

### ✅ Test 2: Get Comments by Task

```bash
curl -X GET "$API_BASE_URL/comments?task_id=$TASK_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of comments

### ✅ Test 3: Get Comments by Project

```bash
curl -X GET "$API_BASE_URL/comments?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of comments

### ✅ Test 4: Update Comment

```bash
curl -X PUT $API_BASE_URL/comments/$COMMENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment content"
  }' | jq '.'
```

**Expected:** Status 200, comment updated

### ✅ Test 5: Delete Comment

```bash
curl -X DELETE $API_BASE_URL/comments/$COMMENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, comment deleted

---

## Test Module Notifications

### ✅ Test 1: Get All Notifications

```bash
curl -X GET "$API_BASE_URL/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of notifications

### ✅ Test 2: Get Unread Notifications Only

```bash
curl -X GET "$API_BASE_URL/notifications?unread_only=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of unread notifications

### ✅ Test 3: Get Unread Count

```bash
curl -X GET $API_BASE_URL/notifications/unread-count \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, unread count

### ✅ Test 4: Mark Notification as Read

```bash
# Dapatkan ID notifikasi pertama
NOTIF_ID=$(curl -s -X GET $API_BASE_URL/notifications \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.data[0].id')

curl -X PATCH $API_BASE_URL/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, notification marked as read

### ✅ Test 5: Mark All as Read

```bash
curl -X PATCH $API_BASE_URL/notifications/read-all \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, all notifications marked as read

---

## Test Module Analytics

### ✅ Test 1: Get Dashboard Analytics

```bash
curl -X GET "$API_BASE_URL/analytics/dashboard?period=month" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, dashboard analytics data

### ✅ Test 2: Get Project Analytics

```bash
curl -X GET "$API_BASE_URL/analytics/projects?period=month" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, project analytics data

### ✅ Test 3: Get Task Analytics

```bash
curl -X GET "$API_BASE_URL/analytics/tasks?project_id=$PROJECT_ID&period=week" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, task analytics data

### ✅ Test 4: Get Team Analytics

```bash
curl -X GET "$API_BASE_URL/analytics/teams?team_id=$TEAM_ID&period=month" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, team analytics data

---

## Test Module Calendar

### ✅ Test 1: Create Calendar Event

```bash
EVENT_RESPONSE=$(curl -s -X POST $API_BASE_URL/calendar/events \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Team Meeting\",
    \"description\": \"Monthly team sync\",
    \"start_date\": \"2024-12-15T10:00:00Z\",
    \"end_date\": \"2024-12-15T11:00:00Z\",
    \"type\": \"meeting\",
    \"project_id\": \"$PROJECT_ID\"
  }")

echo $EVENT_RESPONSE | jq '.'

export EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.data.id')
echo "Event ID: $EVENT_ID"
```

**Expected:** Status 200, event created

### ✅ Test 2: Get Calendar Events

```bash
curl -X GET "$API_BASE_URL/calendar/events?start_date=2024-12-01&end_date=2024-12-31" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of events

### ✅ Test 3: Get Upcoming Events

```bash
curl -X GET $API_BASE_URL/calendar/events/upcoming \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, upcoming events

### ✅ Test 4: Update Calendar Event

```bash
curl -X PUT $API_BASE_URL/calendar/events/$EVENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting Updated",
    "start_date": "2024-12-15T14:00:00Z",
    "end_date": "2024-12-15T15:00:00Z"
  }' | jq '.'
```

**Expected:** Status 200, event updated

### ✅ Test 5: Delete Calendar Event

```bash
curl -X DELETE $API_BASE_URL/calendar/events/$EVENT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, event deleted

---

## Test Module Users

### ✅ Test 1: Get All Users

```bash
curl -X GET "$API_BASE_URL/users?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of users

### ✅ Test 2: Search Users

```bash
curl -X GET "$API_BASE_URL/users?search=test&role=user" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, filtered users

### ✅ Test 3: Get User by ID

```bash
# Dapatkan user ID dari profile
USER_ID=$(curl -s -X GET $API_BASE_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.data.id')

curl -X GET $API_BASE_URL/users/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, user details

### ✅ Test 4: Get User Activity

```bash
curl -X GET $API_BASE_URL/users/$USER_ID/activity \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, user activity logs

---

## Test Module Settings

### ✅ Test 1: Get User Settings

```bash
curl -X GET $API_BASE_URL/settings \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, user settings

### ✅ Test 2: Update User Settings

```bash
curl -X PUT $API_BASE_URL/settings \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "id",
    "notifications": {
      "email": true,
      "push": false,
      "task_assigned": true,
      "task_completed": true
    },
    "timezone": "Asia/Jakarta"
  }' | jq '.'
```

**Expected:** Status 200, settings updated

### ✅ Test 3: Get User Preferences

```bash
curl -X GET $API_BASE_URL/settings/preferences \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, user preferences

### ✅ Test 4: Get Notification Preferences

```bash
curl -X GET $API_BASE_URL/settings/notifications \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, notification preferences

### ✅ Test 5: Get Dashboard Preferences

```bash
curl -X GET $API_BASE_URL/settings/dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, dashboard preferences

---

## Test Module Upload

### ✅ Test 1: Upload File

```bash
# Create dummy test file
echo "This is a test file" > /tmp/test-upload.txt

curl -X POST $API_BASE_URL/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/tmp/test-upload.txt" \
  -F "type=task_attachment" | jq '.'

# Save file ID
export FILE_ID=$(curl -s -X POST $API_BASE_URL/upload \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@/tmp/test-upload.txt" \
  -F "type=avatar" | jq -r '.data.id')
```

**Expected:** Status 200, file uploaded

### ✅ Test 2: Get All Files

```bash
curl -X GET "$API_BASE_URL/upload?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, list of files

### ✅ Test 3: Get File Statistics

```bash
curl -X GET $API_BASE_URL/upload/stats \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, file statistics

### ✅ Test 4: Get File Usage by Project

```bash
curl -X GET $API_BASE_URL/upload/usage/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, file usage by projects

### ✅ Test 5: Get File Usage by Task

```bash
curl -X GET $API_BASE_URL/upload/usage/tasks \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, file usage by tasks

### ✅ Test 6: Delete File

```bash
curl -X DELETE $API_BASE_URL/upload/$FILE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
```

**Expected:** Status 200, file deleted

---

## Automated Testing Script

Simpan script berikut sebagai `test-api.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="http://localhost:9552/api"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="Test123456"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to make API call and check status
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE_URL$endpoint" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_BASE_URL$endpoint" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ]; then
        echo "$body"
        return 0
    else
        echo "Expected: $expected_status, Got: $http_code"
        echo "$body"
        return 1
    fi
}

echo -e "${YELLOW}=== Starting API Tests ===${NC}\n"

# Test 1: Register
echo -e "${YELLOW}[1/11] Testing Auth Module...${NC}"
register_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"user\"}"
result=$(test_endpoint POST "/auth/register" "$register_data")
print_result "Auth - Register" $?

# Test 2: Login
login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
result=$(test_endpoint POST "/auth/login" "$login_data")
print_result "Auth - Login" $?

# Extract token
ACCESS_TOKEN=$(echo $result | jq -r '.data.access_token')

# Test 3: Get Profile
result=$(test_endpoint GET "/auth/me")
print_result "Auth - Get Profile" $?

# Test 4: Create Project
echo -e "\n${YELLOW}[2/11] Testing Projects Module...${NC}"
project_data='{"name":"Test Project","description":"Test","status":"active","start_date":"2024-01-01","end_date":"2024-12-31"}'
result=$(test_endpoint POST "/projects" "$project_data")
print_result "Projects - Create" $?
PROJECT_ID=$(echo $result | jq -r '.data.id')

# Test 5: Get Projects
result=$(test_endpoint GET "/projects?page=1&limit=10")
print_result "Projects - Get All" $?

# Test 6: Get Project Stats
result=$(test_endpoint GET "/projects/$PROJECT_ID/stats")
print_result "Projects - Get Stats" $?

# Test 7: Create Task
echo -e "\n${YELLOW}[3/11] Testing Tasks Module...${NC}"
task_data="{\"title\":\"Test Task\",\"description\":\"Test\",\"status\":\"todo\",\"priority\":\"medium\",\"project_id\":\"$PROJECT_ID\"}"
result=$(test_endpoint POST "/tasks" "$task_data")
print_result "Tasks - Create" $?
TASK_ID=$(echo $result | jq -r '.data.id')

# Test 8: Get Tasks
result=$(test_endpoint GET "/tasks?project_id=$PROJECT_ID")
print_result "Tasks - Get All" $?

# Test 9: Update Task Status
status_data='{"status":"in_progress"}'
result=$(test_endpoint PATCH "/tasks/$TASK_ID/status" "$status_data")
print_result "Tasks - Update Status" $?

# Test 10: Create Team
echo -e "\n${YELLOW}[4/11] Testing Teams Module...${NC}"
team_data='{"name":"Test Team","description":"Test","status":"active"}'
result=$(test_endpoint POST "/teams" "$team_data")
print_result "Teams - Create" $?
TEAM_ID=$(echo $result | jq -r '.data.id')

# Test 11: Get Teams
result=$(test_endpoint GET "/teams")
print_result "Teams - Get All" $?

# Test 12: Create Comment
echo -e "\n${YELLOW}[5/11] Testing Comments Module...${NC}"
comment_data="{\"content\":\"Test comment\",\"task_id\":\"$TASK_ID\",\"project_id\":\"$PROJECT_ID\"}"
result=$(test_endpoint POST "/comments" "$comment_data")
print_result "Comments - Create" $?

# Test 13: Get Comments
result=$(test_endpoint GET "/comments?task_id=$TASK_ID")
print_result "Comments - Get by Task" $?

# Test 14: Get Notifications
echo -e "\n${YELLOW}[6/11] Testing Notifications Module...${NC}"
result=$(test_endpoint GET "/notifications")
print_result "Notifications - Get All" $?

# Test 15: Get Unread Count
result=$(test_endpoint GET "/notifications/unread-count")
print_result "Notifications - Get Unread Count" $?

# Test 16: Get Dashboard Analytics
echo -e "\n${YELLOW}[7/11] Testing Analytics Module...${NC}"
result=$(test_endpoint GET "/analytics/dashboard")
print_result "Analytics - Dashboard" $?

# Test 17: Get Project Analytics
result=$(test_endpoint GET "/analytics/projects")
print_result "Analytics - Projects" $?

# Test 18: Create Calendar Event
echo -e "\n${YELLOW}[8/11] Testing Calendar Module...${NC}"
event_data="{\"title\":\"Test Meeting\",\"description\":\"Test\",\"start_date\":\"2024-12-15T10:00:00Z\",\"end_date\":\"2024-12-15T11:00:00Z\",\"type\":\"meeting\"}"
result=$(test_endpoint POST "/calendar/events" "$event_data")
print_result "Calendar - Create Event" $?

# Test 19: Get Calendar Events
result=$(test_endpoint GET "/calendar/events?start_date=2024-12-01&end_date=2024-12-31")
print_result "Calendar - Get Events" $?

# Test 20: Get Users
echo -e "\n${YELLOW}[9/11] Testing Users Module...${NC}"
result=$(test_endpoint GET "/users")
print_result "Users - Get All" $?

# Test 21: Get User Settings
echo -e "\n${YELLOW}[10/11] Testing Settings Module...${NC}"
result=$(test_endpoint GET "/settings")
print_result "Settings - Get User Settings" $?

# Test 22: Update Settings
settings_data='{"theme":"dark","language":"id"}'
result=$(test_endpoint PUT "/settings" "$settings_data")
print_result "Settings - Update" $?

# Test 23: Get File Stats
echo -e "\n${YELLOW}[11/11] Testing Upload Module...${NC}"
result=$(test_endpoint GET "/upload/stats")
print_result "Upload - Get Stats" $?

# Summary
echo -e "\n${YELLOW}=== Test Summary ===${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed! ❌${NC}"
    exit 1
fi
```

### Menjalankan Automated Test:

```bash
# Berikan permission execute
chmod +x test-api.sh

# Jalankan test
./test-api.sh
```

---

## Postman Collection

Untuk import ke Postman, buat file `postman-collection.json`:

```json
{
  "info": {
    "name": "Project Tracker API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:9552/api"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

---

## Tips Testing

### 1. Check Server Running
```bash
curl http://localhost:9552/api/auth/login
```

### 2. Test Token Validity
```bash
curl -X GET $API_BASE_URL/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. Monitor Server Logs
```bash
# Terminal terpisah
tail -f logs/application/*.log
```

### 4. Database Check
```bash
# Masuk ke PostgreSQL
psql -U postgres -d tracker_db

# Check data
SELECT * FROM users;
SELECT * FROM projects;
SELECT * FROM tasks;
```

---

## Troubleshooting

### Error 401 Unauthorized
- Token expired atau tidak valid
- Login ulang untuk mendapatkan token baru

### Error 404 Not Found
- Endpoint salah
- Resource ID tidak ditemukan

### Error 422 Validation Error
- Check request body
- Pastikan semua required fields diisi

### Error 500 Internal Server Error
- Check server logs
- Check database connection

---

Selamat testing! 🚀

