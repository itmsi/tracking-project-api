/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('comments').del();
  
  await knex('comments').insert([
    // Comments untuk task "Setup Database Schema"
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      task_id: '11111111-1111-1111-1111-111111111111',
      user_id: '33333333-3333-3333-3333-333333333333',
      content: 'Database schema sudah selesai dibuat. Semua tabel utama sudah ada: users, teams, projects, tasks, dan comments.',
      parent_comment_id: null,
      attachments: null,
      is_active: true,
      created_at: new Date('2024-01-10T10:00:00Z'),
      updated_at: new Date('2024-01-10T10:00:00Z')
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      task_id: '11111111-1111-1111-1111-111111111111',
      user_id: '11111111-1111-1111-1111-111111111111',
      content: 'Bagus! Jangan lupa tambahkan index untuk performa yang lebih baik.',
      parent_comment_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-01-10T11:30:00Z'),
      updated_at: new Date('2024-01-10T11:30:00Z')
    },
    
    // Comments untuk task "Implement Authentication"
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      task_id: '22222222-2222-2222-2222-222222222222',
      user_id: '33333333-3333-3333-3333-333333333333',
      content: 'JWT middleware sudah berhasil diimplementasi. Sekarang sedang mengerjakan endpoint register.',
      parent_comment_id: null,
      attachments: null,
      is_active: true,
      created_at: new Date('2024-01-20T14:15:00Z'),
      updated_at: new Date('2024-01-20T14:15:00Z')
    },
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      task_id: '22222222-2222-2222-2222-222222222222',
      user_id: '22222222-2222-2222-2222-222222222222',
      content: 'Pastikan validasi email dan password strength sudah sesuai dengan requirements.',
      parent_comment_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-01-20T15:45:00Z'),
      updated_at: new Date('2024-01-20T15:45:00Z')
    },
    
    // Comments untuk task "Create API Endpoints"
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      task_id: '33333333-3333-3333-3333-333333333333',
      user_id: '33333333-3333-3333-3333-333333333333',
      content: 'Mulai mengerjakan endpoints untuk users. CRUD operations sudah 50% selesai.',
      parent_comment_id: null,
      attachments: null,
      is_active: true,
      created_at: new Date('2024-02-01T09:00:00Z'),
      updated_at: new Date('2024-02-01T09:00:00Z')
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      task_id: '33333333-3333-3333-3333-333333333333',
      user_id: '44444444-4444-4444-4444-444444444444',
      content: 'Apakah perlu menambahkan pagination untuk list endpoints?',
      parent_comment_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-02-01T10:30:00Z'),
      updated_at: new Date('2024-02-01T10:30:00Z')
    },
    {
      id: '12345678-1234-1234-1234-123456789012',
      task_id: '33333333-3333-3333-3333-333333333333',
      user_id: '33333333-3333-3333-3333-333333333333',
      content: 'Ya, pagination akan ditambahkan untuk semua list endpoints. Sudah ada utility function untuk itu.',
      parent_comment_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-02-01T11:00:00Z'),
      updated_at: new Date('2024-02-01T11:00:00Z')
    },
    
    // Comments untuk task "Design New Wireframes"
    {
      id: '87654321-4321-4321-4321-210987654321',
      task_id: '66666666-6666-6666-6666-666666666666',
      user_id: '55555555-5555-5555-5555-555555555555',
      content: 'Wireframe untuk home screen dan project list sudah selesai. Sekarang mengerjakan task detail screen.',
      parent_comment_id: null,
      attachments: JSON.stringify([
        { name: 'home_wireframe.png', url: '/uploads/wireframes/home_wireframe.png' },
        { name: 'project_list_wireframe.png', url: '/uploads/wireframes/project_list_wireframe.png' }
      ]),
      is_active: true,
      created_at: new Date('2024-02-15T13:20:00Z'),
      updated_at: new Date('2024-02-15T13:20:00Z')
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      task_id: '66666666-6666-6666-6666-666666666666',
      user_id: '22222222-2222-2222-2222-222222222222',
      content: 'Design terlihat bagus! Pastikan konsisten dengan design system yang sudah kita buat.',
      parent_comment_id: '87654321-4321-4321-4321-210987654321',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-02-15T14:45:00Z'),
      updated_at: new Date('2024-02-15T14:45:00Z')
    },
    
    // Comments untuk task "Write Unit Tests"
    {
      id: '22222222-2222-2222-2222-222222222223',
      task_id: '88888888-8888-8888-8888-888888888888',
      user_id: '66666666-6666-6666-6666-666666666666',
      content: 'Unit test untuk auth endpoints sudah selesai dengan coverage 95%. Sekarang mengerjakan users endpoints.',
      parent_comment_id: null,
      attachments: null,
      is_active: true,
      created_at: new Date('2024-03-10T16:00:00Z'),
      updated_at: new Date('2024-03-10T16:00:00Z')
    },
    {
      id: '33333333-3333-3333-3333-333333333334',
      task_id: '88888888-8888-8888-8888-888888888888',
      user_id: '11111111-1111-1111-1111-111111111111',
      content: 'Excellent work! Pastikan juga test edge cases dan error handling.',
      parent_comment_id: '22222222-2222-2222-2222-222222222223',
      attachments: null,
      is_active: true,
      created_at: new Date('2024-03-10T17:30:00Z'),
      updated_at: new Date('2024-03-10T17:30:00Z')
    },
    
    // Comments untuk task "Analyze Query Performance"
    {
      id: '44444444-4444-4444-4444-444444444445',
      task_id: '99999999-9999-9999-9999-999999999999',
      user_id: '33333333-3333-3333-3333-333333333333',
      content: 'Task ini ditunda karena menunggu data production yang lebih representatif untuk dianalisis.',
      parent_comment_id: null,
      attachments: null,
      is_active: true,
      created_at: new Date('2024-04-01T12:00:00Z'),
      updated_at: new Date('2024-04-01T12:00:00Z')
    }
  ]);
};
