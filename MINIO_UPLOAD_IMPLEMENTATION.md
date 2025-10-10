# ☁️ MinIO Upload Implementation - Complete Guide

**Date**: 10 Oktober 2025  
**Status**: ✅ **IMPLEMENTED & READY**  
**Feature**: Upload files ke MinIO cloud storage instead of local disk

---

## 🎯 What Was Implemented?

Upload file sekarang **support MinIO cloud storage** dengan fallback ke local storage!

### ✅ Features:
1. **Automatic MinIO Upload** - Files automatically uploaded to MinIO when enabled
2. **Local Fallback** - Falls back to local storage if MinIO fails
3. **Smart Cleanup** - Deletes local temp files after successful MinIO upload
4. **Public URLs** - Returns accessible URLs instead of local paths
5. **Dual Support** - Works for both Profile Upload & Task Attachments

---

## 📁 Files Modified

### 1. **Profile Upload Handler**
`src/modules/upload/handler.js`
- ✅ Add MinIO import
- ✅ Upload to MinIO after file received
- ✅ Return MinIO URL instead of local path
- ✅ Fallback to local storage if MinIO fails
- ✅ Auto-delete temp files

### 2. **Task Attachment Handler**
`src/modules/tasks/task_view_handler.js`
- ✅ Add MinIO import
- ✅ Upload to MinIO for task attachments
- ✅ Return MinIO URL for attachments
- ✅ Fallback to local storage if MinIO fails
- ✅ Auto-delete temp files

---

## 🚀 How It Works

### Flow Diagram:
```
File Upload Request
      ↓
Save to temp directory (local)
      ↓
MinIO Enabled? ───NO──→ Move to permanent local directory
      ↓ YES                    ↓
Upload to MinIO              Return local path
      ↓
Success? ──NO──→ Move to permanent local directory
      ↓ YES            ↓
Return MinIO URL    Return local path
      ↓
Delete temp file
      ↓
Save URL to database
```

### Code Logic:
```javascript
// 1. Save file to temp (Multer diskStorage)
// uploads/temp/filename.jpg

// 2. Read file buffer
const fileBuffer = fs.readFileSync(req.file.path);

// 3. Upload to MinIO
const uploadResult = await uploadToMinio(
  objectName,
  fileBuffer,
  mimetype
);

// 4. Use MinIO URL or fallback to local
if (uploadResult.success) {
  fileUrl = uploadResult.url; // ✅ MinIO URL
  deleteLocalFile = true;
} else {
  fileUrl = localPath; // ⚠️ Fallback to local
}

// 5. Save to database
fileData.file_path = fileUrl;
```

---

## ⚙️ Configuration

### 1. **Create .env File**
Copy dari environment.example:
```bash
cp environment.example .env
```

### 2. **Configure MinIO Settings**

Edit `.env` file, tambahkan konfigurasi MinIO:

```env
# ===========================================
# MinIO Configuration
# ===========================================
S3_PROVIDER=minio
S3_REGION=us-east-1
S3_BUCKET=tracker-uploads
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
S3_SSL_ENABLED=false
S3_SIGNATURE_VERSION=v4
```

### 3. **Parameter Explanation**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `S3_PROVIDER` | Storage provider (minio/aws) | `minio` |
| `S3_REGION` | MinIO region | `us-east-1` |
| `S3_BUCKET` | Bucket name for uploads | `tracker-uploads` |
| `S3_ACCESS_KEY_ID` | MinIO access key | `minioadmin` |
| `S3_SECRET_ACCESS_KEY` | MinIO secret key | `minioadmin` |
| `S3_ENDPOINT` | MinIO server URL | `http://localhost:9000` |
| `S3_FORCE_PATH_STYLE` | Use path-style URLs | `true` |
| `S3_SSL_ENABLED` | Use HTTPS | `false` (dev), `true` (prod) |
| `S3_SIGNATURE_VERSION` | Signature version | `v4` |

---

## 🐳 Setup MinIO Server

### Option 1: Docker (Recommended)

```bash
# Pull MinIO image
docker pull minio/minio

# Run MinIO server
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

Access MinIO Console: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

### Option 2: Docker Compose

Create `docker-compose.minio.yml`:
```yaml
version: '3.8'

services:
  minio:
    image: minio/minio
    container_name: tracker-minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  minio_data:
    driver: local
```

Run:
```bash
docker-compose -f docker-compose.minio.yml up -d
```

### Option 3: Local Installation

**macOS:**
```bash
brew install minio/stable/minio
minio server ~/minio/data
```

**Linux:**
```bash
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
./minio server ~/minio/data
```

**Windows:**
Download from: https://min.io/download

---

## 🪣 Create Bucket

### Via MinIO Console:
1. Open http://localhost:9001
2. Login with credentials
3. Click "Buckets" → "Create Bucket"
4. Name: `tracker-uploads`
5. Click "Create"

### Via CLI (mc):
```bash
# Install mc (MinIO Client)
brew install minio/stable/mc

# Configure alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb local/tracker-uploads

# Set public access policy
mc anonymous set download local/tracker-uploads
```

### Via Code (Automatic):
MinIO config sudah handle automatic bucket creation! Lihat `src/config/minio.js`:
```javascript
// Check if bucket exists, if not create it
const bucketExists = await minioClient.bucketExists(bucket);
if (!bucketExists) {
  await minioClient.makeBucket(bucket, process.env.S3_REGION);
  console.log(`Bucket '${bucket}' created successfully.`);
}
```

---

## 🧪 Testing

### Test 1: Enable MinIO

Edit `.env`:
```env
S3_PROVIDER=minio
S3_BUCKET=tracker-uploads
S3_ENDPOINT=http://localhost:9000
# ... other config
```

Restart server:
```bash
npm run dev
```

### Test 2: Upload Avatar

```bash
curl -X POST 'http://localhost:9553/api/upload' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@./avatar.jpg' \
  -F 'type=avatar' \
  -F 'description=Test MinIO upload'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "id": "uuid",
    "file_name": "timestamp_uuid_avatar.jpg",
    "file_path": "http://localhost:9000/tracker-uploads/avatar/timestamp_uuid_avatar.jpg",
    "file_size": 150000,
    "mime_type": "image/jpeg"
  }
}
```

✅ Notice: `file_path` is now **MinIO URL** instead of local path!

### Test 3: Upload Task Attachment

```bash
TASK_ID="your-task-id"
curl -X POST "http://localhost:9553/api/tasks/${TASK_ID}/attachments/upload" \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@./document.pdf' \
  -F 'file_type=document' \
  -F 'description=Test attachment'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "id": "uuid",
    "file_path": "http://localhost:9000/tracker-uploads/task_attachments/TASK_ID/filename.pdf"
  }
}
```

### Test 4: Verify in MinIO Console

1. Open http://localhost:9001
2. Navigate to "Buckets" → "tracker-uploads"
3. Check folders:
   - `avatar/` - Profile avatars
   - `task_attachments/` - Task files
   - `general/` - General uploads

---

## 🔍 Backend Logs

### With MinIO Enabled:
```
🚀 Upload started at: 2025-10-10T10:00:00.000Z
📂 Creating upload directory: /path/to/uploads/temp
📝 Generating filename for: avatar.jpg
✅ Generated filename: timestamp_uuid_avatar.jpg
📦 File received: { size: 150000, path: '/path/to/temp/...' }
☁️  Uploading file to MinIO...
✅ File uploaded to MinIO: http://localhost:9000/tracker-uploads/avatar/...
🗑️  Local temp file deleted after MinIO upload
💾 Saving file record to database: { storage: 'MinIO', url: 'http://...' }
✅ Upload completed in 1234ms
```

### With MinIO Disabled:
```
🚀 Upload started at: 2025-10-10T10:00:00.000Z
ℹ️  MinIO disabled, using local storage
📂 Creating permanent directory: /path/to/uploads/avatar
✅ File moved successfully
💾 Saving file record to database: { storage: 'Local', url: '/path/to/...' }
✅ Upload completed in 567ms
```

### MinIO Upload Failed (Fallback):
```
☁️  Uploading file to MinIO...
❌ Error uploading to MinIO: Connection refused
⚠️  Falling back to local storage
📂 Creating permanent directory: /path/to/uploads/avatar
✅ File moved successfully
💾 Saving file record to database: { storage: 'Local', url: '/path/to/...' }
✅ Upload completed in 890ms
```

---

## 📊 Comparison: Local vs MinIO

| Feature | Local Storage | MinIO Storage |
|---------|---------------|---------------|
| **Accessibility** | ❌ Not accessible from internet | ✅ Public URL accessible |
| **Scalability** | ❌ Limited by disk space | ✅ Scalable cloud storage |
| **Portability** | ❌ Tied to server | ✅ Can move servers |
| **Backup** | ❌ Manual | ✅ Can configure replication |
| **CDN** | ❌ No | ✅ Can integrate with CDN |
| **Speed** | ✅ Fast (local disk) | ⚡ Fast (network, but cached) |
| **Cost** | ✅ Free (your disk) | 💰 Hosting cost |
| **Setup** | ✅ Simple | ⚙️ Requires MinIO server |

---

## 🔒 Security & Access Control

### Public Bucket Policy
Files uploaded dapat diakses publik dengan URL. MinIO automatically sets bucket policy:

```javascript
// src/config/minio.js
const bucketPolicy = {
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Principal: { AWS: ['*'] },
    Action: ['s3:GetObject'],
    Resource: [`arn:aws:s3:::${bucket}/*`]
  }]
};
```

### Private Files (Optional)
Jika perlu private files, gunakan signed URLs:
```javascript
// Generate signed URL (expires in 1 hour)
const signedUrl = await minioClient.presignedGetObject(
  bucket,
  objectName,
  3600 // 1 hour
);
```

---

## 🌍 Production Setup

### AWS S3 Alternative

Jika tidak mau host MinIO sendiri, bisa gunakan AWS S3:

```env
S3_PROVIDER=aws
AWS_ENABLED=true
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket
```

### MinIO Production Server

```env
S3_PROVIDER=minio
S3_ENDPOINT=https://minio.yourcompany.com
S3_SSL_ENABLED=true
S3_BUCKET=tracker-uploads-prod
S3_ACCESS_KEY_ID=production-access-key
S3_SECRET_ACCESS_KEY=production-secret-key
```

### Recommended Production Setup:
1. **HTTPS** - Always use SSL in production
2. **Strong Credentials** - Change default minioadmin/minioadmin
3. **Backup** - Configure MinIO replication/backup
4. **Monitoring** - Monitor storage usage
5. **CDN** - Use CloudFlare/CloudFront for faster access

---

## 🔄 Migration from Local to MinIO

### Step 1: Enable MinIO
Configure `.env` with MinIO settings

### Step 2: Upload Continues to MinIO
New uploads automatically go to MinIO

### Step 3: Migrate Existing Files (Optional)

Create migration script:
```javascript
// migrate-to-minio.js
const fs = require('fs');
const path = require('path');
const { uploadToMinio } = require('./src/config/minio');
const { pgCore } = require('./src/config/database');

async function migrateFiles() {
  // Get all files from database
  const files = await pgCore('file_uploads').select('*');
  
  for (const file of files) {
    const localPath = file.file_path;
    
    // Skip if already MinIO URL
    if (localPath.includes('http')) continue;
    
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const objectName = `${file.type}/${file.file_name}`;
      
      const result = await uploadToMinio(objectName, buffer, file.mime_type);
      
      if (result.success) {
        // Update database
        await pgCore('file_uploads')
          .where('id', file.id)
          .update({ file_path: result.url });
        
        console.log(`✅ Migrated: ${file.original_name}`);
      }
    }
  }
}

migrateFiles().catch(console.error);
```

Run migration:
```bash
node migrate-to-minio.js
```

---

## 🐛 Troubleshooting

### Issue 1: "MinIO is disabled"
**Solution**: Check `.env` file has `S3_PROVIDER=minio`

### Issue 2: Connection refused
**Solution**: 
- Check MinIO server running: `docker ps | grep minio`
- Check endpoint URL correct: `http://localhost:9000`
- Try: `curl http://localhost:9000/minio/health/live`

### Issue 3: Bucket not found
**Solution**:
- Check bucket name in `.env` matches created bucket
- Or let code auto-create bucket (already implemented)

### Issue 4: Files still local paths
**Solution**:
- Restart server after configuring MinIO
- Check logs for "MinIO enabled" message
- Verify `isMinioEnabled` returns true

### Issue 5: Access denied to files
**Solution**:
- Check bucket policy set to public
- Run: `mc anonymous set download local/tracker-uploads`
- Or configure in MinIO console

---

## ✅ Verification Checklist

- [ ] MinIO server running
- [ ] Bucket created (`tracker-uploads`)
- [ ] `.env` configured with MinIO settings
- [ ] Server restarted
- [ ] Upload test successful
- [ ] File URL is MinIO URL (not local path)
- [ ] File accessible via URL
- [ ] Logs show "MinIO enabled"
- [ ] Temp files deleted after upload

---

## 📚 Additional Resources

- **MinIO Docs**: https://min.io/docs/minio/linux/index.html
- **MinIO Client**: https://min.io/docs/minio/linux/reference/minio-mc.html
- **Docker Hub**: https://hub.docker.com/r/minio/minio

---

## 🎉 Summary

### What We Achieved:
✅ **MinIO Integration** - Full cloud storage support  
✅ **Automatic Upload** - Files auto-upload to MinIO  
✅ **Public URLs** - Return accessible URLs  
✅ **Smart Fallback** - Local storage if MinIO fails  
✅ **Auto Cleanup** - Delete temp files  
✅ **Dual Support** - Profile & Task attachments

### Impact:
- 🌍 **Accessible** - Files accessible from anywhere
- 📈 **Scalable** - No disk space limits
- 🚀 **Faster** - Can use CDN
- 💪 **Reliable** - Fallback to local if needed

---

**Status**: ✅ **READY FOR USE**

Enable MinIO and enjoy cloud storage! ☁️🚀

---

**Last Updated**: 10 Oktober 2025  
**Implemented By**: AI Assistant

