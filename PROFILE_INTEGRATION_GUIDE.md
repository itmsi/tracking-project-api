# 👤 Panduan Integrasi Frontend - User Profile

Dokumen ini menjelaskan cara mengintegrasikan fitur profil user dengan backend API untuk aplikasi frontend (React/Vue/Angular/JavaScript).

---

## 📑 Daftar Isi

1. [Authentication Setup](#authentication-setup)
2. [Get Profile](#get-profile)
3. [Update Profile](#update-profile)
4. [Upload Avatar](#upload-avatar)
5. [Change Password](#change-password)
6. [Get User Detail](#get-user-detail)
7. [React Implementation Examples](#react-implementation-examples)
8. [Vue Implementation Examples](#vue-implementation-examples)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## 🔐 Authentication Setup

Semua endpoint profil memerlukan JWT token. Token harus disertakan dalam setiap request.

### Setup Axios dengan Interceptor

```javascript
// src/api/axios.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - tambahkan token ke setiap request
apiClient.interceptors.request.use(
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

// Response interceptor - handle token expired
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 👤 Get Profile

Mengambil data profil user yang sedang login.

### Endpoint
```
GET /api/auth/me
```

### Request Headers
```
Authorization: Bearer <your-jwt-token>
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Profile berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "developer",
    "avatar_url": "https://example.com/avatars/john.jpg",
    "last_login": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### JavaScript Implementation

```javascript
// src/api/profileService.js
import apiClient from './axios';

export const profileService = {
  // Get current user profile
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }
};

// Usage
async function fetchUserProfile() {
  try {
    const result = await profileService.getProfile();
    console.log('User profile:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error.response?.data?.message);
  }
}
```

### Fetch API Implementation

```javascript
// Using Fetch API
async function getProfile() {
  const token = localStorage.getItem('access_token');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## ✏️ Update Profile

Mengupdate informasi profil user (nama depan, nama belakang, avatar URL).

### Endpoint
```
PUT /api/auth/profile
```

### Request Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Request Body
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "avatar_url": "https://example.com/avatars/new-avatar.jpg"
}
```

**Note:** Semua field bersifat optional. Kirim hanya field yang ingin diupdate.

### Response Success (200)
```json
{
  "success": true,
  "message": "Profile berhasil diperbarui",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "role": "developer",
    "avatar_url": "https://example.com/avatars/new-avatar.jpg",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### Response Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "error": "avatar_url tidak valid"
}
```

### JavaScript Implementation

```javascript
// src/api/profileService.js
export const profileService = {
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }
};

// Usage
async function updateUserProfile() {
  const profileData = {
    first_name: 'John',
    last_name: 'Smith',
    avatar_url: 'https://example.com/avatars/new-avatar.jpg'
  };

  try {
    const result = await profileService.updateProfile(profileData);
    console.log('Profile updated:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to update profile:', error.response?.data?.message);
  }
}
```

### Form Validation (Frontend)

```javascript
// src/utils/profileValidation.js
export function validateProfileForm(data) {
  const errors = {};

  // Validate first_name
  if (data.first_name && data.first_name.trim().length === 0) {
    errors.first_name = 'Nama depan tidak boleh kosong';
  }
  if (data.first_name && data.first_name.length > 100) {
    errors.first_name = 'Nama depan maksimal 100 karakter';
  }

  // Validate last_name
  if (data.last_name && data.last_name.trim().length === 0) {
    errors.last_name = 'Nama belakang tidak boleh kosong';
  }
  if (data.last_name && data.last_name.length > 100) {
    errors.last_name = 'Nama belakang maksimal 100 karakter';
  }

  // Validate avatar_url
  if (data.avatar_url) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(data.avatar_url)) {
      errors.avatar_url = 'URL avatar tidak valid';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## 📸 Upload Avatar

Upload foto profil user dilakukan dalam 2 langkah:
1. Upload file ke server (mendapatkan URL)
2. Update profil dengan avatar URL yang baru

### Step 1: Upload File

#### Endpoint
```
POST /api/upload
```

#### Request Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

#### Request Body (Form Data)
```
file: [File gambar]
type: "avatar"
description: "Foto profil user" (optional)
```

#### Response Success (201)
```json
{
  "success": true,
  "message": "File berhasil diupload",
  "data": {
    "id": "file-uuid",
    "user_id": "user-uuid",
    "original_name": "profile-photo.jpg",
    "file_name": "1705310400000-profile-photo.jpg",
    "file_path": "avatar/1705310400000-profile-photo.jpg",
    "file_size": 150000,
    "mime_type": "image/jpeg",
    "type": "avatar",
    "url": "https://your-storage-url/bucket/avatar/1705310400000-profile-photo.jpg",
    "created_at": "2024-01-15T12:00:00.000Z"
  }
}
```

### Step 2: Update Profile dengan Avatar URL

Gunakan URL dari response step 1 untuk update profil (lihat [Update Profile](#update-profile)).

### JavaScript Implementation (Complete Flow)

```javascript
// src/api/profileService.js
export const profileService = {
  // Upload avatar image
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');
      formData.append('description', 'Foto profil user');

      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Complete upload avatar flow (upload + update profile)
  async uploadAndUpdateAvatar(file) {
    try {
      // Step 1: Upload file
      const uploadResult = await this.uploadAvatar(file);
      const avatarUrl = uploadResult.data.url;

      // Step 2: Update profile with new avatar URL
      const updateResult = await this.updateProfile({
        avatar_url: avatarUrl
      });

      return {
        success: true,
        uploadData: uploadResult.data,
        profileData: updateResult.data
      };
    } catch (error) {
      console.error('Error in upload and update avatar:', error);
      throw error;
    }
  }
};

// Usage
async function handleAvatarUpload(fileInput) {
  const file = fileInput.files[0];
  
  // Validate file
  if (!file) {
    console.error('No file selected');
    return;
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    console.error('Invalid file type. Only JPG, PNG, GIF, WEBP allowed');
    return;
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    console.error('File too large. Maximum size is 10MB');
    return;
  }

  try {
    const result = await profileService.uploadAndUpdateAvatar(file);
    console.log('Avatar updated successfully:', result.profileData);
    return result.profileData;
  } catch (error) {
    console.error('Failed to upload avatar:', error.response?.data?.message);
  }
}
```

### Image Preview Before Upload

```javascript
// src/utils/imagePreview.js
export function previewImage(file, callback) {
  const reader = new FileReader();
  
  reader.onloadend = () => {
    callback(reader.result);
  };
  
  if (file) {
    reader.readAsDataURL(file);
  }
}

// Usage
const fileInput = document.getElementById('avatar-input');
const previewImg = document.getElementById('avatar-preview');

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  
  previewImage(file, (imageUrl) => {
    previewImg.src = imageUrl;
  });
});
```

### Image Compression (Optional)

```javascript
// src/utils/imageCompression.js
// Using browser-image-compression library
import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 800,
    useWebWorker: true
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

// Usage
async function handleAvatarUploadWithCompression(fileInput) {
  const file = fileInput.files[0];
  
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file);
    console.log('Original size:', file.size / 1024 / 1024, 'MB');
    console.log('Compressed size:', compressedFile.size / 1024 / 1024, 'MB');
    
    // Upload compressed image
    const result = await profileService.uploadAndUpdateAvatar(compressedFile);
    return result.profileData;
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

---

## 🔒 Change Password

Mengubah password user yang sedang login.

### Endpoint
```
PUT /api/auth/change-password
```

### Request Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Request Body
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword456",
  "confirm_password": "newpassword456"
}
```

### Response Success (200)
```json
{
  "success": true,
  "message": "Password berhasil diubah"
}
```

### Response Error (400)
```json
{
  "success": false,
  "message": "Password lama salah"
}
```

### JavaScript Implementation

```javascript
// src/api/profileService.js
export const profileService = {
  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiClient.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

// Usage
async function changeUserPassword() {
  const passwordData = {
    current_password: 'oldpassword123',
    new_password: 'newpassword456',
    confirm_password: 'newpassword456'
  };

  try {
    const result = await profileService.changePassword(passwordData);
    console.log('Password changed successfully');
    
    // Optional: logout user and redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    
    return result;
  } catch (error) {
    console.error('Failed to change password:', error.response?.data?.message);
  }
}
```

### Password Validation (Frontend)

```javascript
// src/utils/passwordValidation.js
export function validatePasswordForm(data) {
  const errors = {};

  // Validate current_password
  if (!data.current_password) {
    errors.current_password = 'Password lama harus diisi';
  }

  // Validate new_password
  if (!data.new_password) {
    errors.new_password = 'Password baru harus diisi';
  } else if (data.new_password.length < 6) {
    errors.new_password = 'Password baru minimal 6 karakter';
  } else if (data.new_password === data.current_password) {
    errors.new_password = 'Password baru tidak boleh sama dengan password lama';
  }

  // Validate confirm_password
  if (!data.confirm_password) {
    errors.confirm_password = 'Konfirmasi password harus diisi';
  } else if (data.new_password !== data.confirm_password) {
    errors.confirm_password = 'Konfirmasi password tidak cocok';
  }

  // Password strength validation
  const hasUpperCase = /[A-Z]/.test(data.new_password);
  const hasLowerCase = /[a-z]/.test(data.new_password);
  const hasNumbers = /\d/.test(data.new_password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(data.new_password);

  if (data.new_password && (!hasUpperCase || !hasLowerCase || !hasNumbers)) {
    errors.password_strength = 'Password harus mengandung huruf besar, huruf kecil, dan angka';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## 👥 Get User Detail

Mendapatkan detail user lain (untuk admin atau melihat profil user lain).

### Endpoint
```
GET /api/users/:id
```

### Request Headers
```
Authorization: Bearer <your-jwt-token>
```

### Response Success (200)
```json
{
  "success": true,
  "message": "User berhasil diambil",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "jane.doe@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "role": "project_manager",
    "avatar_url": "https://example.com/avatars/jane.jpg",
    "last_login": "2024-01-15T09:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-10T00:00:00.000Z"
  }
}
```

### JavaScript Implementation

```javascript
// src/api/userService.js
import apiClient from './axios';

export const userService = {
  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
};

// Usage
async function fetchUserProfile(userId) {
  try {
    const result = await userService.getUserById(userId);
    console.log('User profile:', result.data);
    return result.data;
  } catch (error) {
    console.error('Failed to fetch user:', error.response?.data?.message);
  }
}
```

---

## ⚛️ React Implementation Examples

### Complete Profile Component

```jsx
// src/components/Profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { profileService } from '../../api/profileService';
import { validateProfileForm } from '../../utils/profileValidation';
import './ProfilePage.css';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    avatar_url: ''
  });

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await profileService.getProfile();
      setProfile(result.data);
      setFormData({
        first_name: result.data.first_name || '',
        last_name: result.data.last_name || '',
        avatar_url: result.data.avatar_url || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    // Validate form
    const validation = validateProfileForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      const result = await profileService.updateProfile(formData);
      setProfile(result.data);
      setEditing(false);
      setSuccessMessage('Profil berhasil diperbarui!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrors({ general: error.response?.data?.message || 'Gagal memperbarui profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setSuccessMessage('');
    
    // Reset form to current profile data
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  };

  if (loading && !profile) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>Profil User</h1>
        
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        
        {errors.general && (
          <div className="alert alert-error">{errors.general}</div>
        )}

        {!editing ? (
          // View Mode
          <div className="profile-view">
            <div className="profile-avatar">
              <img 
                src={profile?.avatar_url || 'https://via.placeholder.com/150'} 
                alt="Avatar"
              />
            </div>
            
            <div className="profile-info">
              <div className="info-group">
                <label>Email:</label>
                <span>{profile?.email}</span>
              </div>
              
              <div className="info-group">
                <label>Nama Depan:</label>
                <span>{profile?.first_name}</span>
              </div>
              
              <div className="info-group">
                <label>Nama Belakang:</label>
                <span>{profile?.last_name}</span>
              </div>
              
              <div className="info-group">
                <label>Role:</label>
                <span className={`badge badge-${profile?.role}`}>
                  {profile?.role}
                </span>
              </div>
              
              <div className="info-group">
                <label>Last Login:</label>
                <span>{new Date(profile?.last_login).toLocaleString()}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profil
            </button>
          </div>
        ) : (
          // Edit Mode
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="first_name">Nama Depan *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && (
                <span className="error-message">{errors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nama Belakang *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && (
                <span className="error-message">{errors.last_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="avatar_url">Avatar URL</label>
              <input
                type="text"
                id="avatar_url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
                className={errors.avatar_url ? 'error' : ''}
              />
              {errors.avatar_url && (
                <span className="error-message">{errors.avatar_url}</span>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
```

### Avatar Upload Component

```jsx
// src/components/Profile/AvatarUpload.jsx
import React, { useState, useRef } from 'react';
import { profileService } from '../../api/profileService';
import { previewImage } from '../../utils/imagePreview';
import './AvatarUpload.css';

function AvatarUpload({ currentAvatar, onUploadSuccess }) {
  const [preview, setPreview] = useState(currentAvatar);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setError('');

    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WEBP');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Ukuran file terlalu besar. Maksimal 10MB');
      return;
    }

    // Show preview
    previewImage(file, (imageUrl) => {
      setPreview(imageUrl);
    });

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    try {
      setUploading(true);
      setError('');

      const result = await profileService.uploadAndUpdateAvatar(file);
      
      setPreview(result.profileData.avatar_url);
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(result.profileData);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.message || 'Gagal mengupload avatar');
      // Restore previous avatar on error
      setPreview(currentAvatar);
    } finally {
      setUploading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="avatar-upload">
      <div className="avatar-preview">
        <img 
          src={preview || 'https://via.placeholder.com/150'} 
          alt="Avatar"
        />
        
        {uploading && (
          <div className="avatar-uploading-overlay">
            <div className="spinner"></div>
            <span>Uploading...</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <button 
        className="btn btn-upload"
        onClick={handleClickUpload}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Ganti Avatar'}
      </button>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <p className="upload-hint">
        Format: JPG, PNG, GIF, WEBP. Max: 10MB
      </p>
    </div>
  );
}

export default AvatarUpload;
```

### Change Password Component

```jsx
// src/components/Profile/ChangePassword.jsx
import React, { useState } from 'react';
import { profileService } from '../../api/profileService';
import { validatePasswordForm } from '../../utils/passwordValidation';
import './ChangePassword.css';

function ChangePassword() {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    // Validate form
    const validation = validatePasswordForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      await profileService.changePassword(formData);
      
      setSuccessMessage('Password berhasil diubah! Anda akan logout dalam 3 detik...');
      
      // Reset form
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Logout after 3 seconds
      setTimeout(() => {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }, 3000);
      
    } catch (error) {
      console.error('Failed to change password:', error);
      setErrors({ 
        general: error.response?.data?.message || 'Gagal mengubah password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password">
      <h2>Ganti Password</h2>
      
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}
      
      {errors.general && (
        <div className="alert alert-error">{errors.general}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="current_password">Password Lama *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="current_password"
              name="current_password"
              value={formData.current_password}
              onChange={handleInputChange}
              className={errors.current_password ? 'error' : ''}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.current_password && (
            <span className="error-message">{errors.current_password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="new_password">Password Baru *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              className={errors.new_password ? 'error' : ''}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.new_password && (
            <span className="error-message">{errors.new_password}</span>
          )}
          {errors.password_strength && (
            <span className="error-message">{errors.password_strength}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Konfirmasi Password Baru *</label>
          <div className="password-input-wrapper">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              className={errors.confirm_password ? 'error' : ''}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.confirm_password && (
            <span className="error-message">{errors.confirm_password}</span>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Mengubah Password...' : 'Ganti Password'}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
```

---

## 🎨 Vue Implementation Examples

### Profile Component (Vue 3 Composition API)

```vue
<!-- src/components/Profile/ProfilePage.vue -->
<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1>Profil User</h1>
      
      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      
      <div v-if="errors.general" class="alert alert-error">
        {{ errors.general }}
      </div>

      <div v-if="loading && !profile" class="loading">
        Loading...
      </div>

      <!-- View Mode -->
      <div v-else-if="!editing" class="profile-view">
        <div class="profile-avatar">
          <img 
            :src="profile?.avatar_url || 'https://via.placeholder.com/150'" 
            alt="Avatar"
          />
        </div>
        
        <div class="profile-info">
          <div class="info-group">
            <label>Email:</label>
            <span>{{ profile?.email }}</span>
          </div>
          
          <div class="info-group">
            <label>Nama Depan:</label>
            <span>{{ profile?.first_name }}</span>
          </div>
          
          <div class="info-group">
            <label>Nama Belakang:</label>
            <span>{{ profile?.last_name }}</span>
          </div>
          
          <div class="info-group">
            <label>Role:</label>
            <span :class="`badge badge-${profile?.role}`">
              {{ profile?.role }}
            </span>
          </div>
        </div>
        
        <button class="btn btn-primary" @click="editing = true">
          Edit Profil
        </button>
      </div>

      <!-- Edit Mode -->
      <form v-else class="profile-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="first_name">Nama Depan *</label>
          <input
            v-model="formData.first_name"
            type="text"
            id="first_name"
            :class="{ error: errors.first_name }"
          />
          <span v-if="errors.first_name" class="error-message">
            {{ errors.first_name }}
          </span>
        </div>

        <div class="form-group">
          <label for="last_name">Nama Belakang *</label>
          <input
            v-model="formData.last_name"
            type="text"
            id="last_name"
            :class="{ error: errors.last_name }"
          />
          <span v-if="errors.last_name" class="error-message">
            {{ errors.last_name }}
          </span>
        </div>

        <div class="form-group">
          <label for="avatar_url">Avatar URL</label>
          <input
            v-model="formData.avatar_url"
            type="text"
            id="avatar_url"
            placeholder="https://example.com/avatar.jpg"
            :class="{ error: errors.avatar_url }"
          />
          <span v-if="errors.avatar_url" class="error-message">
            {{ errors.avatar_url }}
          </span>
        </div>

        <div class="form-actions">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan' }}
          </button>
          
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="handleCancel"
            :disabled="loading"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { profileService } from '@/api/profileService';
import { validateProfileForm } from '@/utils/profileValidation';

const profile = ref(null);
const loading = ref(true);
const editing = ref(false);
const errors = reactive({});
const successMessage = ref('');

const formData = reactive({
  first_name: '',
  last_name: '',
  avatar_url: ''
});

onMounted(() => {
  fetchProfile();
});

const fetchProfile = async () => {
  try {
    loading.value = true;
    const result = await profileService.getProfile();
    profile.value = result.data;
    
    formData.first_name = result.data.first_name || '';
    formData.last_name = result.data.last_name || '';
    formData.avatar_url = result.data.avatar_url || '';
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  successMessage.value = '';
  Object.keys(errors).forEach(key => delete errors[key]);
  
  // Validate form
  const validation = validateProfileForm(formData);
  if (!validation.isValid) {
    Object.assign(errors, validation.errors);
    return;
  }

  try {
    loading.value = true;
    const result = await profileService.updateProfile(formData);
    profile.value = result.data;
    editing.value = false;
    successMessage.value = 'Profil berhasil diperbarui!';
    
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('Failed to update profile:', error);
    errors.general = error.response?.data?.message || 'Gagal memperbarui profil';
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  editing.value = false;
  Object.keys(errors).forEach(key => delete errors[key]);
  successMessage.value = '';
  
  if (profile.value) {
    formData.first_name = profile.value.first_name || '';
    formData.last_name = profile.value.last_name || '';
    formData.avatar_url = profile.value.avatar_url || '';
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
```

---

## 🚨 Error Handling

### Common Error Responses

```javascript
// src/utils/errorHandler.js
export function handleApiError(error) {
  if (!error.response) {
    // Network error
    return {
      message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      type: 'network'
    };
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      return {
        message: data.message || 'Data yang dikirim tidak valid',
        type: 'validation',
        errors: data.errors
      };
    
    case 401:
      // Token expired or invalid
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return {
        message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        type: 'unauthorized'
      };
    
    case 403:
      return {
        message: data.message || 'Anda tidak memiliki akses untuk melakukan aksi ini',
        type: 'forbidden'
      };
    
    case 404:
      return {
        message: data.message || 'Data tidak ditemukan',
        type: 'not_found'
      };
    
    case 500:
      return {
        message: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
        type: 'server_error'
      };
    
    default:
      return {
        message: data.message || 'Terjadi kesalahan. Silakan coba lagi.',
        type: 'unknown'
      };
  }
}

// Usage
import { handleApiError } from '@/utils/errorHandler';

async function updateProfile(data) {
  try {
    const result = await profileService.updateProfile(data);
    return result;
  } catch (error) {
    const errorInfo = handleApiError(error);
    console.error('Error:', errorInfo.message);
    
    // Show error to user
    alert(errorInfo.message);
    
    throw errorInfo;
  }
}
```

---

## ✅ Best Practices

### 1. Token Management

```javascript
// src/utils/tokenManager.js
export const tokenManager = {
  // Save token
  setToken(token) {
    localStorage.setItem('access_token', token);
  },

  // Get token
  getToken() {
    return localStorage.getItem('access_token');
  },

  // Remove token
  removeToken() {
    localStorage.removeItem('access_token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Decode JWT token to get user info
  decodeToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired() {
    const decoded = this.decodeToken();
    if (!decoded || !decoded.exp) return true;

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }
};
```

### 2. Profile State Management (React Context)

```jsx
// src/contexts/ProfileContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileService } from '../api/profileService';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const result = await profileService.getProfile();
      setProfile(result.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    const result = await profileService.updateProfile(data);
    setProfile(result.data);
    return result;
  };

  const uploadAvatar = async (file) => {
    const result = await profileService.uploadAndUpdateAvatar(file);
    setProfile(result.profileData);
    return result;
  };

  const value = {
    profile,
    loading,
    loadProfile,
    updateProfile,
    uploadAvatar
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}

// Usage in component
function MyComponent() {
  const { profile, loading, updateProfile } = useProfile();
  
  // Use profile data
  return (
    <div>
      {loading ? 'Loading...' : profile?.first_name}
    </div>
  );
}
```

### 3. Protected Routes

```jsx
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager } from '../utils/tokenManager';

function ProtectedRoute({ children }) {
  const isAuthenticated = tokenManager.isAuthenticated();
  const isExpired = tokenManager.isTokenExpired();

  if (!isAuthenticated || isExpired) {
    // Redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

// Usage in App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './components/Profile/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### 4. Loading States & Optimistic Updates

```javascript
// Optimistic update example
async function updateProfileOptimistic(newData) {
  const previousProfile = { ...profile };
  
  // Update UI immediately
  setProfile({ ...profile, ...newData });
  
  try {
    // Send to server
    await profileService.updateProfile(newData);
  } catch (error) {
    // Revert on error
    setProfile(previousProfile);
    throw error;
  }
}
```

### 5. Debounce Input for Live Validation

```javascript
// src/utils/debounce.js
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
import { debounce } from '@/utils/debounce';

const validateField = debounce((field, value) => {
  // Validate field
  console.log('Validating:', field, value);
}, 500);

// In component
const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Validate after user stops typing (500ms)
  validateField(name, value);
};
```

---

## 🎯 Summary

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/profile` | PUT | Update profile |
| `/api/auth/change-password` | PUT | Change password |
| `/api/upload` | POST | Upload file (avatar) |
| `/api/users/:id` | GET | Get user by ID |

### Important Notes

1. **Token Required**: Semua endpoint memerlukan JWT token di header `Authorization`
2. **Avatar Upload**: 2 langkah - upload file dulu, lalu update profile dengan URL
3. **File Validation**: 
   - Allowed types: JPG, PNG, GIF, WEBP
   - Max size: 10MB
4. **Password**: Minimal 6 karakter, harus berbeda dengan password lama
5. **Error Handling**: Selalu handle error 401 (redirect ke login)

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Authentication Guide](./AUTH_INTEGRATION_GUIDE.md)
- [File Upload Guide](./UPLOAD_GUIDE.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0

