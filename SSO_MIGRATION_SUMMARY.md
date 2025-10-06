# SSO Migration Summary

## Perubahan yang Dilakukan

### 1. Penghapusan Sistem Autentikasi Internal
- **Dihapus endpoint:**
  - `POST /api/auth/register` - Registrasi user baru
  - `POST /api/auth/login` - Login dengan email/password
  - `POST /api/auth/refresh-token` - Refresh token
  - `PUT /api/auth/change-password` - Ubah password
  - `POST /api/auth/logout` - Logout

### 2. Endpoint yang Dipertahankan untuk SSO
- **Endpoint yang masih aktif:**
  - `GET /api/auth/me` - Get profile user (menggunakan SSO token)
  - `PUT /api/auth/profile` - Update profile user (menggunakan SSO token)

### 3. Token Verification
- **Middleware yang digunakan:** `verifyToken` dari `src/middlewares/token.js`
- **Cara kerja:** 
  - Menerima token dari header `Authorization: Bearer <token>`
  - Decode token menggunakan `jwt-decode`
  - Menyimpan decoded token ke `req.user`
  - Memvalidasi role user

### 4. Perubahan di Semua Modul
Semua modul sekarang menggunakan `verifyToken` instead of `authenticateToken`:
- `/api/projects/*` - Semua endpoint memerlukan SSO token
- `/api/tasks/*` - Semua endpoint memerlukan SSO token  
- `/api/comments/*` - Semua endpoint memerlukan SSO token
- `/api/teams/*` - Semua endpoint memerlukan SSO token
- `/api/users/*` - Semua endpoint memerlukan SSO token

### 5. File yang Dimodifikasi
- `src/modules/auth/index.js` - Dihapus endpoint login/register
- `src/modules/auth/handler.js` - Dihapus method login/register/changePassword/logout
- `src/modules/auth/validation.js` - Dihapus validasi login/register
- `src/modules/auth/postgre_repository.js` - Dihapus method password-related
- `src/middlewares/token.js` - Dihapus authenticateToken middleware
- Semua file routing di `src/modules/*/index.js` - Ganti authenticateToken ke verifyToken

## Cara Penggunaan SSO

### 1. Request dengan Token
```bash
curl -X GET "http://localhost:3000/api/auth/me" \
  -H "Authorization: Bearer <SSO_TOKEN>"
```

### 2. Token Format
Token harus berisi informasi user seperti:
```json
{
  "id": "user_id",
  "email": "user@example.com", 
  "roles": ["admin"],
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 3. Role Validation
- Token dengan role `CUSTOMER_BUYER` akan ditolak
- Role lain akan diterima dan disimpan di `req.user`

## Catatan Penting
- Sistem sekarang 100% bergantung pada SSO untuk autentikasi
- Tidak ada lagi registrasi atau login internal
- Semua endpoint memerlukan valid SSO token
- Token verification menggunakan `jwt-decode` untuk decode tanpa verifikasi signature
