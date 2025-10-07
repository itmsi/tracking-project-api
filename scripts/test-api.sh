#!/bin/bash

# =============================================================================
# Project Tracker API Testing Script
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:9552/api}"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="Test123456"

# Global variables
ACCESS_TOKEN=""
PROJECT_ID=""
TASK_ID=""
TEAM_ID=""
COMMENT_ID=""
EVENT_ID=""
USER_ID=""

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}$1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_test() {
    echo -e "${YELLOW}→${NC} Testing: $1"
}

print_result() {
    local test_name=$1
    local status=$2
    local response=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $status -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗${NC} $test_name"
        echo -e "  ${RED}Response: $response${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Function to make API call
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local content_type=${4:-"application/json"}
    
    if [ -z "$data" ]; then
        curl -s -w "\n%{http_code}" -X $method "$API_BASE_URL$endpoint" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: $content_type"
    else
        curl -s -w "\n%{http_code}" -X $method "$API_BASE_URL$endpoint" \
            -H "Authorization: Bearer $ACCESS_TOKEN" \
            -H "Content-Type: $content_type" \
            -d "$data"
    fi
}

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=${5:-200}
    
    print_test "$test_name"
    
    response=$(api_call "$method" "$endpoint" "$data")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq 201 ]; then
        print_result "$test_name" 0
        echo "$body"
        return 0
    else
        print_result "$test_name" 1 "Status: $http_code - $body"
        echo "$body"
        return 1
    fi
}

# Check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}Warning: jq is not installed. Install it for better JSON parsing.${NC}"
        echo -e "${YELLOW}MacOS: brew install jq${NC}"
        echo -e "${YELLOW}Linux: sudo apt-get install jq${NC}"
        return 1
    fi
    return 0
}

# =============================================================================
# Test Modules
# =============================================================================

test_auth_module() {
    print_header "1. TESTING AUTH MODULE"
    
    # Test 1: Register
    register_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"user\"}"
    result=$(test_endpoint "Register User" "POST" "/auth/register" "$register_data" 201)
    
    # Test 2: Login
    login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
    result=$(test_endpoint "Login User" "POST" "/auth/login" "$login_data")
    
    # Extract token
    if check_jq; then
        ACCESS_TOKEN=$(echo $result | jq -r '.data.access_token // .data.token // empty')
        USER_ID=$(echo $result | jq -r '.data.user.id // .data.id // empty')
    else
        # Fallback without jq
        ACCESS_TOKEN=$(echo $result | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        USER_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    if [ -z "$ACCESS_TOKEN" ]; then
        echo -e "${RED}Failed to extract access token. Cannot continue tests.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Token obtained: ${ACCESS_TOKEN:0:20}...${NC}"
    
    # Test 3: Get Profile
    test_endpoint "Get User Profile" "GET" "/auth/me" > /dev/null
    
    # Test 4: Update Profile
    profile_data='{"first_name":"Test Updated","last_name":"User Updated"}'
    test_endpoint "Update Profile" "PUT" "/auth/profile" "$profile_data" > /dev/null
    
    sleep 1
}

test_projects_module() {
    print_header "2. TESTING PROJECTS MODULE"
    
    # Test 1: Create Project
    project_data='{"name":"Test Project API","description":"Testing project creation","status":"active","start_date":"2024-01-01","end_date":"2024-12-31","color":"#3f51b5"}'
    result=$(test_endpoint "Create Project" "POST" "/projects" "$project_data" 201)
    
    # Extract project ID
    if check_jq; then
        PROJECT_ID=$(echo $result | jq -r '.data.id // empty')
    else
        PROJECT_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    if [ -n "$PROJECT_ID" ]; then
        echo -e "${GREEN}Project ID: $PROJECT_ID${NC}"
    fi
    
    # Test 2: Get All Projects
    test_endpoint "Get Projects List" "GET" "/projects?page=1&limit=10" > /dev/null
    
    # Test 3: Get Project by ID
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "Get Project Detail" "GET" "/projects/$PROJECT_ID" > /dev/null
        
        # Test 4: Update Project
        update_data='{"name":"Test Project Updated","status":"in_progress"}'
        test_endpoint "Update Project" "PUT" "/projects/$PROJECT_ID" "$update_data" > /dev/null
        
        # Test 5: Get Project Stats
        test_endpoint "Get Project Statistics" "GET" "/projects/$PROJECT_ID/stats" > /dev/null
        
        # Test 6: Get Project Members
        test_endpoint "Get Project Members" "GET" "/projects/$PROJECT_ID/members" > /dev/null
    fi
    
    sleep 1
}

test_tasks_module() {
    print_header "3. TESTING TASKS MODULE"
    
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}Skipping tasks tests - no project ID${NC}"
        return
    fi
    
    # Test 1: Create Task
    task_data="{\"title\":\"Test Task API\",\"description\":\"Testing task creation\",\"status\":\"todo\",\"priority\":\"medium\",\"project_id\":\"$PROJECT_ID\",\"due_date\":\"2024-12-31\"}"
    result=$(test_endpoint "Create Task" "POST" "/tasks" "$task_data" 201)
    
    # Extract task ID
    if check_jq; then
        TASK_ID=$(echo $result | jq -r '.data.id // empty')
    else
        TASK_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    if [ -n "$TASK_ID" ]; then
        echo -e "${GREEN}Task ID: $TASK_ID${NC}"
    fi
    
    # Test 2: Get All Tasks
    test_endpoint "Get Tasks List" "GET" "/tasks?project_id=$PROJECT_ID" > /dev/null
    
    if [ -n "$TASK_ID" ]; then
        # Test 3: Get Task Detail
        test_endpoint "Get Task Detail" "GET" "/tasks/$TASK_ID" > /dev/null
        
        # Test 4: Update Task
        update_data='{"title":"Test Task Updated","priority":"high"}'
        test_endpoint "Update Task" "PUT" "/tasks/$TASK_ID" "$update_data" > /dev/null
        
        # Test 5: Update Task Status
        status_data='{"status":"in_progress","position":1}'
        test_endpoint "Update Task Status" "PATCH" "/tasks/$TASK_ID/status" "$status_data" > /dev/null
        
        # Test 6: Assign Task
        assign_data='{"assigned_to":null}'
        test_endpoint "Assign Task" "PATCH" "/tasks/$TASK_ID/assign" "$assign_data" > /dev/null
        
        # Test 7: Get Subtasks
        test_endpoint "Get Subtasks" "GET" "/tasks/$TASK_ID/subtasks" > /dev/null
        
        # Test 8: Create Subtask
        subtask_data='{"title":"Test Subtask","description":"Testing subtask","priority":"low"}'
        test_endpoint "Create Subtask" "POST" "/tasks/$TASK_ID/subtasks" "$subtask_data" > /dev/null
    fi
    
    sleep 1
}

test_teams_module() {
    print_header "4. TESTING TEAMS MODULE"
    
    # Test 1: Create Team
    team_data='{"name":"Frontend Team API","description":"Testing team creation","status":"active"}'
    result=$(test_endpoint "Create Team" "POST" "/teams" "$team_data" 201)
    
    # Extract team ID
    if check_jq; then
        TEAM_ID=$(echo $result | jq -r '.data.id // empty')
    else
        TEAM_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    if [ -n "$TEAM_ID" ]; then
        echo -e "${GREEN}Team ID: $TEAM_ID${NC}"
    fi
    
    # Test 2: Get All Teams
    test_endpoint "Get Teams List" "GET" "/teams?page=1&limit=10" > /dev/null
    
    if [ -n "$TEAM_ID" ]; then
        # Test 3: Get Team Detail
        test_endpoint "Get Team Detail" "GET" "/teams/$TEAM_ID" > /dev/null
        
        # Test 4: Update Team
        update_data='{"name":"Frontend Team Updated","description":"Updated description"}'
        test_endpoint "Update Team" "PUT" "/teams/$TEAM_ID" "$update_data" > /dev/null
        
        # Test 5: Get Team Members
        test_endpoint "Get Team Members" "GET" "/teams/$TEAM_ID/members" > /dev/null
    fi
    
    sleep 1
}

test_comments_module() {
    print_header "5. TESTING COMMENTS MODULE"
    
    if [ -z "$TASK_ID" ]; then
        echo -e "${YELLOW}Skipping comments tests - no task ID${NC}"
        return
    fi
    
    # Test 1: Create Comment
    comment_data="{\"content\":\"This is a test comment via API\",\"task_id\":\"$TASK_ID\",\"project_id\":\"$PROJECT_ID\"}"
    result=$(test_endpoint "Create Comment" "POST" "/comments" "$comment_data" 201)
    
    # Extract comment ID
    if check_jq; then
        COMMENT_ID=$(echo $result | jq -r '.data.id // empty')
    else
        COMMENT_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    # Test 2: Get Comments by Task
    test_endpoint "Get Comments by Task" "GET" "/comments?task_id=$TASK_ID" > /dev/null
    
    # Test 3: Get Comments by Project
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "Get Comments by Project" "GET" "/comments?project_id=$PROJECT_ID" > /dev/null
    fi
    
    if [ -n "$COMMENT_ID" ]; then
        # Test 4: Update Comment
        update_data='{"content":"Updated comment content via API"}'
        test_endpoint "Update Comment" "PUT" "/comments/$COMMENT_ID" "$update_data" > /dev/null
    fi
    
    sleep 1
}

test_notifications_module() {
    print_header "6. TESTING NOTIFICATIONS MODULE"
    
    # Test 1: Get All Notifications
    test_endpoint "Get All Notifications" "GET" "/notifications?page=1&limit=10" > /dev/null
    
    # Test 2: Get Unread Notifications
    test_endpoint "Get Unread Notifications" "GET" "/notifications?unread_only=true" > /dev/null
    
    # Test 3: Get Unread Count
    test_endpoint "Get Unread Count" "GET" "/notifications/unread-count" > /dev/null
    
    # Test 4: Mark All as Read
    test_endpoint "Mark All as Read" "PATCH" "/notifications/read-all" > /dev/null
    
    sleep 1
}

test_analytics_module() {
    print_header "7. TESTING ANALYTICS MODULE"
    
    # Test 1: Get Dashboard Analytics
    test_endpoint "Get Dashboard Analytics" "GET" "/analytics/dashboard?period=month" > /dev/null
    
    # Test 2: Get Project Analytics
    test_endpoint "Get Project Analytics" "GET" "/analytics/projects?period=month" > /dev/null
    
    # Test 3: Get Task Analytics
    if [ -n "$PROJECT_ID" ]; then
        test_endpoint "Get Task Analytics" "GET" "/analytics/tasks?project_id=$PROJECT_ID&period=week" > /dev/null
    fi
    
    # Test 4: Get Team Analytics
    if [ -n "$TEAM_ID" ]; then
        test_endpoint "Get Team Analytics" "GET" "/analytics/teams?team_id=$TEAM_ID&period=month" > /dev/null
    fi
    
    sleep 1
}

test_calendar_module() {
    print_header "8. TESTING CALENDAR MODULE"
    
    # Test 1: Create Calendar Event
    event_data="{\"title\":\"Team Meeting API\",\"description\":\"Monthly sync\",\"start_date\":\"2024-12-15T10:00:00Z\",\"end_date\":\"2024-12-15T11:00:00Z\",\"type\":\"meeting\",\"project_id\":\"$PROJECT_ID\"}"
    result=$(test_endpoint "Create Calendar Event" "POST" "/calendar/events" "$event_data" 201)
    
    # Extract event ID
    if check_jq; then
        EVENT_ID=$(echo $result | jq -r '.data.id // empty')
    else
        EVENT_ID=$(echo $result | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    fi
    
    # Test 2: Get Calendar Events
    test_endpoint "Get Calendar Events" "GET" "/calendar/events?start_date=2024-12-01&end_date=2024-12-31" > /dev/null
    
    # Test 3: Get Upcoming Events
    test_endpoint "Get Upcoming Events" "GET" "/calendar/events/upcoming" > /dev/null
    
    if [ -n "$EVENT_ID" ]; then
        # Test 4: Update Calendar Event
        update_data='{"title":"Team Meeting Updated","start_date":"2024-12-15T14:00:00Z","end_date":"2024-12-15T15:00:00Z"}'
        test_endpoint "Update Calendar Event" "PUT" "/calendar/events/$EVENT_ID" "$update_data" > /dev/null
    fi
    
    sleep 1
}

test_users_module() {
    print_header "9. TESTING USERS MODULE"
    
    # Test 1: Get All Users
    test_endpoint "Get All Users" "GET" "/users?page=1&limit=10" > /dev/null
    
    # Test 2: Search Users
    test_endpoint "Search Users" "GET" "/users?search=test" > /dev/null
    
    # Test 3: Get User Detail
    if [ -n "$USER_ID" ]; then
        test_endpoint "Get User Detail" "GET" "/users/$USER_ID" > /dev/null
        
        # Test 4: Get User Activity
        test_endpoint "Get User Activity" "GET" "/users/$USER_ID/activity" > /dev/null
    fi
    
    sleep 1
}

test_settings_module() {
    print_header "10. TESTING SETTINGS MODULE"
    
    # Test 1: Get User Settings
    test_endpoint "Get User Settings" "GET" "/settings" > /dev/null
    
    # Test 2: Update User Settings
    settings_data='{"theme":"dark","language":"id","notifications":{"email":true,"push":false,"task_assigned":true},"timezone":"Asia/Jakarta"}'
    test_endpoint "Update User Settings" "PUT" "/settings" "$settings_data" > /dev/null
    
    # Test 3: Get User Preferences
    test_endpoint "Get User Preferences" "GET" "/settings/preferences" > /dev/null
    
    # Test 4: Get Notification Preferences
    test_endpoint "Get Notification Preferences" "GET" "/settings/notifications" > /dev/null
    
    # Test 5: Get Dashboard Preferences
    test_endpoint "Get Dashboard Preferences" "GET" "/settings/dashboard" > /dev/null
    
    sleep 1
}

test_upload_module() {
    print_header "11. TESTING UPLOAD MODULE"
    
    # Test 1: Get File Stats
    test_endpoint "Get File Statistics" "GET" "/upload/stats" > /dev/null
    
    # Test 2: Get Files List
    test_endpoint "Get Files List" "GET" "/upload?page=1&limit=10" > /dev/null
    
    # Test 3: Get File Usage by Project
    test_endpoint "Get File Usage by Project" "GET" "/upload/usage/projects" > /dev/null
    
    # Test 4: Get File Usage by Task
    test_endpoint "Get File Usage by Task" "GET" "/upload/usage/tasks" > /dev/null
    
    sleep 1
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                                                                  ║"
    echo "║         PROJECT TRACKER API - AUTOMATED TESTING SUITE           ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${CYAN}API Base URL: ${YELLOW}$API_BASE_URL${NC}"
    echo -e "${CYAN}Test Email: ${YELLOW}$TEST_EMAIL${NC}"
    echo ""
    
    # Check if server is running
    echo -e "${YELLOW}Checking if server is running...${NC}"
    if ! curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL" > /dev/null; then
        echo -e "${RED}Error: Cannot connect to API server at $API_BASE_URL${NC}"
        echo -e "${YELLOW}Please make sure the server is running.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Server is running${NC}"
    
    # Run all tests
    test_auth_module
    test_projects_module
    test_tasks_module
    test_teams_module
    test_comments_module
    test_notifications_module
    test_analytics_module
    test_calendar_module
    test_users_module
    test_settings_module
    test_upload_module
    
    # Print summary
    echo ""
    print_header "TEST SUMMARY"
    echo ""
    echo -e "${CYAN}Total Tests Run: ${YELLOW}$TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                   ALL TESTS PASSED! 🎉                          ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                   SOME TESTS FAILED ❌                          ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════════╝${NC}"
        exit 1
    fi
}

# Run main function
main

