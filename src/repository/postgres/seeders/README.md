# Database Seeders

Dokumentasi untuk seeder database yang menyediakan data dummy untuk testing dan development.

## 📋 Daftar Seeder

### 1. Users Seeder (`0001_users_seeder.js`)
Membuat 6 user dengan berbagai role:
- **Admin**: `admin@tracker.com` / `password123`
- **Project Manager**: `manager@tracker.com` / `password123`
- **Developer**: `developer@tracker.com` / `password123`
- **User**: `user@tracker.com` / `password123`
- **Designer**: `designer@tracker.com` / `password123`
- **Tester**: `tester@tracker.com` / `password123`

### 2. Teams Seeder (`0002_teams_seeder.js`)
Membuat 3 team:
- **Development Team**: Tim pengembangan utama
- **Design Team**: Tim desain UI/UX
- **QA Team**: Tim Quality Assurance

### 3. Projects Seeder (`0003_projects_seeder.js`)
Membuat 5 project dengan berbagai status:
- **Project Tracker App**: Project utama (active)
- **Mobile App Redesign**: Project redesign (active)
- **API Testing Suite**: Project testing (active)
- **Database Optimization**: Project optimasi (on_hold)
- **User Documentation**: Project dokumentasi (completed)

### 4. Tasks Seeder (`0004_tasks_seeder.js`)
Membuat 9 task dengan berbagai status dan priority:
- Tasks untuk Project Tracker App
- Tasks untuk Mobile App Redesign
- Tasks untuk API Testing Suite
- Tasks untuk Database Optimization

### 5. Comments Seeder (`0005_comments_seeder.js`)
Membuat 10 komentar dengan beberapa balasan untuk berbagai task.

### 6. Team Members Seeder (`0006_team_members_seeder.js`)
Menghubungkan users dengan teams sesuai role mereka.

### 7. Project Members Seeder (`0007_project_members_seeder.js`)
Menghubungkan users dengan projects sesuai role mereka.

### 8. Activity Logs Seeder (`0008_activity_logs_seeder.js`)
Membuat log aktivitas untuk tracking semua perubahan data.

## 🚀 Cara Menjalankan Seeder

### Menjalankan Semua Seeder
```bash
npm run seed:all
```

### Menjalankan Seeder Individual
```bash
# Menggunakan knex CLI
npm run seed

# Atau menjalankan file seeder langsung
node src/repository/postgres/seeders/0001_users_seeder.js
```

## 📝 Prerequisites

1. **Pastikan migration sudah dijalankan terlebih dahulu:**
   ```bash
   npm run migrate
   ```

2. **Pastikan database connection sudah dikonfigurasi dengan benar** di file `src/knexfile.js`

3. **Pastikan semua dependencies sudah terinstall:**
   ```bash
   npm install
   ```

## 🔧 Struktur Data

### Users
- 6 users dengan berbagai role (admin, project_manager, developer, user)
- Semua password di-hash menggunakan bcrypt
- Email unik untuk setiap user

### Teams
- 3 teams dengan deskripsi yang jelas
- Setiap team memiliki owner/admin

### Projects
- 5 projects dengan berbagai status
- Beberapa project terhubung dengan team
- Setiap project memiliki owner

### Tasks
- 9 tasks dengan berbagai status (todo, in_progress, done, blocked)
- Berbagai priority (low, medium, high, urgent)
- Beberapa task memiliki checklist dan attachments
- Beberapa task adalah subtask dari task lain

### Comments
- 10 komentar dengan beberapa balasan
- Beberapa komentar memiliki attachments
- Komentar terhubung dengan task dan user

### Team Members & Project Members
- Menghubungkan users dengan teams/projects
- Berbagai role (owner, admin, member, viewer)

### Activity Logs
- Log untuk semua aktivitas (created, updated, deleted, assigned)
- Tracking perubahan data dengan old_values dan new_values
- Deskripsi human-readable untuk setiap aktivitas

## 🎯 Penggunaan untuk Testing

Seeder ini menyediakan data yang lengkap untuk testing semua fitur aplikasi:

1. **Authentication**: Login dengan berbagai role
2. **Authorization**: Test akses berdasarkan role
3. **CRUD Operations**: Test semua operasi create, read, update, delete
4. **Relationships**: Test relasi antar tabel
5. **Activity Tracking**: Test logging aktivitas
6. **Comments System**: Test sistem komentar dan balasan
7. **Task Management**: Test manajemen task dengan berbagai status
8. **Project Management**: Test manajemen project dan team

## 🔄 Reset Database

Untuk reset database dan menjalankan seeder ulang:

```bash
# Rollback semua migration
npm run migrate:rollback

# Jalankan migration lagi
npm run migrate

# Jalankan seeder
npm run seed:all
```

## 📊 Statistik Data

- **Users**: 6
- **Teams**: 3
- **Projects**: 5
- **Tasks**: 9
- **Comments**: 10
- **Team Members**: 10
- **Project Members**: 15
- **Activity Logs**: 12

Total data yang dihasilkan: **70 records** untuk testing yang komprehensif.
