# ⚡ MinIO Quick Setup Guide

Setup MinIO untuk upload files dalam **5 menit**!

---

## 🚀 Quick Start

### Step 1: Run MinIO (Docker)

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

### Step 2: Configure Environment

Edit `.env` (atau create from environment.example):

```env
# MinIO Configuration
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

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test Upload

```bash
curl -X POST 'http://localhost:9553/api/upload' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@./test.jpg' \
  -F 'type=avatar'
```

**Expected**: `file_path` should be MinIO URL like:
```
http://localhost:9000/tracker-uploads/avatar/...
```

---

## ✅ Done!

Files sekarang otomatis upload ke MinIO! ☁️

---

## 📊 Verify

### Check MinIO Console:
http://localhost:9001
- Login: minioadmin / minioadmin
- Check bucket: `tracker-uploads`

### Check Backend Logs:
```
☁️  Uploading file to MinIO...
✅ File uploaded to MinIO: http://localhost:9000/...
🗑️  Local temp file deleted after MinIO upload
```

---

## 🔧 Disable MinIO (Fallback to Local)

Jika MinIO bermasalah, edit `.env`:
```env
S3_PROVIDER=local
# atau comment/remove S3_PROVIDER
```

Restart server, file akan tersimpan local lagi.

---

## 📚 Full Documentation

Lihat [MINIO_UPLOAD_IMPLEMENTATION.md](./MINIO_UPLOAD_IMPLEMENTATION.md) untuk:
- Complete configuration
- Production setup
- Migration guide
- Troubleshooting

---

**Questions?** Check logs atau lihat dokumentasi lengkap!

