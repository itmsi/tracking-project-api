#!/bin/bash

# Test Upload Script
# This script tests the upload endpoint with various scenarios

BASE_URL="http://localhost:9553/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExMTExMTExLTExMTEtMTExMS0xMTExLTExMTExMTExMTExMSIsImVtYWlsIjoiYWRtaW5AdHJhY2tlci5jb20iLCJyb2xlIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3NTk5OTgxNzUsImV4cCI6MTc2MDA4NDU3NX0.M9LQ0SLb6AvR1EFD1pxVRKiASy7nxnGeBKi_cD1yz0s"

echo "========================================"
echo "🧪 UPLOAD ENDPOINT TEST SUITE"
echo "========================================"
echo ""

# Test 1: No file
echo "Test 1: Upload tanpa file (should fail)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "type=avatar" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 2: No type
echo "Test 2: Upload tanpa type (should fail)"
echo "----------------------------------------"
# Create a small test file
echo "test content" > /tmp/test-upload.txt

curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/tmp/test-upload.txt" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 3: Small file (text)
echo "Test 3: Upload small text file (should succeed)"
echo "------------------------------------------------"
curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/tmp/test-upload.txt" \
  -F "type=general" \
  -F "description=Test text file" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 4: Create a small image for testing
echo "Test 4: Upload small image (should succeed)"
echo "--------------------------------------------"

# Check if we can find an existing image or create a dummy one
if [ -f "public/images/example.png" ]; then
  TEST_IMAGE="public/images/example.png"
elif [ -f "logo192.png" ]; then
  TEST_IMAGE="logo192.png"
else
  # Create a tiny 1x1 pixel PNG (43 bytes)
  echo "Creating test image..."
  echo -n "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-image.png
  TEST_IMAGE="/tmp/test-image.png"
fi

echo "Using image: ${TEST_IMAGE}"

curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@${TEST_IMAGE}" \
  -F "type=avatar" \
  -F "description=Test avatar image" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 5: Invalid file type
echo "Test 5: Upload invalid file type (should fail)"
echo "-----------------------------------------------"
echo "#!/bin/bash" > /tmp/test-script.sh
curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/tmp/test-script.sh" \
  -F "type=general" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Test 6: Invalid type value
echo "Test 6: Upload with invalid type (should fail)"
echo "-----------------------------------------------"
curl -X POST "${BASE_URL}/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "file=@/tmp/test-upload.txt" \
  -F "type=invalid_type" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo ""

# Cleanup
rm -f /tmp/test-upload.txt /tmp/test-script.sh /tmp/test-image.png

echo "========================================"
echo "✅ Test suite completed"
echo "========================================"
echo ""
echo "💡 Tips:"
echo "- Check backend console for detailed logs"
echo "- Look for emoji markers (🚀 📦 ✅ ❌) in logs"
echo "- Verify files created in uploads/ directory"
echo ""

