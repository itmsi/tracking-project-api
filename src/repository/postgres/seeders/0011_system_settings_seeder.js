/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('system_settings').del();
  
  // Inserts seed entries
  await knex('system_settings').insert([
    {
      key: 'app_name',
      value: 'Project Tracker',
      type: 'string',
      description: 'Nama aplikasi',
      category: 'general'
    },
    {
      key: 'app_version',
      value: '1.0.0',
      type: 'string',
      description: 'Versi aplikasi',
      category: 'general'
    },
    {
      key: 'max_file_size',
      value: '10485760',
      type: 'number',
      description: 'Ukuran maksimal file upload dalam bytes (10MB)',
      category: 'file_upload'
    },
    {
      key: 'allowed_file_types',
      value: '["image/jpeg","image/png","image/gif","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","text/plain","application/zip","application/x-rar-compressed"]',
      type: 'json',
      description: 'Tipe file yang diizinkan untuk upload',
      category: 'file_upload'
    },
    {
      key: 'default_task_priority',
      value: 'medium',
      type: 'string',
      description: 'Priority default untuk task baru',
      category: 'task'
    },
    {
      key: 'default_project_status',
      value: 'active',
      type: 'string',
      description: 'Status default untuk project baru',
      category: 'project'
    },
    {
      key: 'email_notifications_enabled',
      value: 'true',
      type: 'boolean',
      description: 'Aktifkan notifikasi email',
      category: 'email'
    },
    {
      key: 'push_notifications_enabled',
      value: 'true',
      type: 'boolean',
      description: 'Aktifkan notifikasi push',
      category: 'notification'
    },
    {
      key: 'session_timeout',
      value: '86400',
      type: 'number',
      description: 'Timeout session dalam detik (24 jam)',
      category: 'security'
    },
    {
      key: 'max_login_attempts',
      value: '5',
      type: 'number',
      description: 'Maksimal percobaan login',
      category: 'security'
    },
    {
      key: 'password_min_length',
      value: '6',
      type: 'number',
      description: 'Panjang minimum password',
      category: 'security'
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      description: 'Mode maintenance',
      category: 'system'
    }
  ]);
};
