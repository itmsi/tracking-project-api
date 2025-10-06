/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('tasks').del();
  
  await knex('tasks').insert([
    // Tasks untuk Project Tracker App
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Setup Database Schema',
      description: 'Membuat struktur database untuk aplikasi project tracker',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      created_by: '11111111-1111-1111-1111-111111111111',
      assigned_to: '33333333-3333-3333-3333-333333333333',
      status: 'done',
      priority: 'high',
      due_date: '2024-01-15',
      position: 1,
      checklist: JSON.stringify([
        { id: 1, text: 'Create users table', completed: true },
        { id: 2, text: 'Create teams table', completed: true },
        { id: 3, text: 'Create projects table', completed: true },
        { id: 4, text: 'Create tasks table', completed: true }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Implement Authentication',
      description: 'Membuat sistem autentikasi dengan JWT dan middleware',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      created_by: '11111111-1111-1111-1111-111111111111',
      assigned_to: '33333333-3333-3333-3333-333333333333',
      status: 'in_progress',
      priority: 'high',
      due_date: '2024-01-30',
      position: 2,
      checklist: JSON.stringify([
        { id: 1, text: 'Setup JWT middleware', completed: true },
        { id: 2, text: 'Create login endpoint', completed: true },
        { id: 3, text: 'Create register endpoint', completed: false },
        { id: 4, text: 'Add password hashing', completed: true }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Create API Endpoints',
      description: 'Membuat semua endpoint API untuk CRUD operations',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      created_by: '22222222-2222-2222-2222-222222222222',
      assigned_to: '33333333-3333-3333-3333-333333333333',
      status: 'todo',
      priority: 'medium',
      due_date: '2024-02-15',
      position: 3,
      checklist: JSON.stringify([
        { id: 1, text: 'Users endpoints', completed: false },
        { id: 2, text: 'Teams endpoints', completed: false },
        { id: 3, text: 'Projects endpoints', completed: false },
        { id: 4, text: 'Tasks endpoints', completed: false }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      title: 'Add Input Validation',
      description: 'Menambahkan validasi input untuk semua endpoint',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      created_by: '33333333-3333-3333-3333-333333333333',
      assigned_to: '33333333-3333-3333-3333-333333333333',
      status: 'todo',
      priority: 'medium',
      due_date: '2024-02-20',
      position: 4,
      checklist: null,
      attachments: null,
      parent_task_id: '33333333-3333-3333-3333-333333333333',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Tasks untuk Mobile App Redesign
    {
      id: '55555555-5555-5555-5555-555555555555',
      title: 'Research UI/UX Trends',
      description: 'Melakukan riset tren UI/UX terbaru untuk mobile app',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      created_by: '22222222-2222-2222-2222-222222222222',
      assigned_to: '55555555-5555-5555-5555-555555555555',
      status: 'done',
      priority: 'low',
      due_date: '2024-02-10',
      position: 1,
      checklist: JSON.stringify([
        { id: 1, text: 'Analyze competitor apps', completed: true },
        { id: 2, text: 'Study design systems', completed: true },
        { id: 3, text: 'Create mood board', completed: true }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      title: 'Design New Wireframes',
      description: 'Membuat wireframe baru untuk semua halaman aplikasi',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      created_by: '22222222-2222-2222-2222-222222222222',
      assigned_to: '55555555-5555-5555-5555-555555555555',
      status: 'in_progress',
      priority: 'high',
      due_date: '2024-03-01',
      position: 2,
      checklist: JSON.stringify([
        { id: 1, text: 'Home screen wireframe', completed: true },
        { id: 2, text: 'Project list wireframe', completed: true },
        { id: 3, text: 'Task detail wireframe', completed: false },
        { id: 4, text: 'Profile wireframe', completed: false }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Tasks untuk API Testing Suite
    {
      id: '77777777-7777-7777-7777-777777777777',
      title: 'Setup Testing Framework',
      description: 'Setup framework testing untuk API endpoints',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      created_by: '11111111-1111-1111-1111-111111111111',
      assigned_to: '66666666-6666-6666-6666-666666666666',
      status: 'done',
      priority: 'high',
      due_date: '2024-03-05',
      position: 1,
      checklist: JSON.stringify([
        { id: 1, text: 'Install Jest', completed: true },
        { id: 2, text: 'Setup test database', completed: true },
        { id: 3, text: 'Create test utilities', completed: true }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '88888888-8888-8888-8888-888888888888',
      title: 'Write Unit Tests',
      description: 'Menulis unit test untuk semua endpoint API',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      created_by: '11111111-1111-1111-1111-111111111111',
      assigned_to: '66666666-6666-6666-6666-666666666666',
      status: 'in_progress',
      priority: 'medium',
      due_date: '2024-04-01',
      position: 2,
      checklist: JSON.stringify([
        { id: 1, text: 'Auth endpoints tests', completed: true },
        { id: 2, text: 'Users endpoints tests', completed: false },
        { id: 3, text: 'Projects endpoints tests', completed: false },
        { id: 4, text: 'Tasks endpoints tests', completed: false }
      ]),
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Tasks untuk Database Optimization
    {
      id: '99999999-9999-9999-9999-999999999999',
      title: 'Analyze Query Performance',
      description: 'Menganalisis performa query database yang ada',
      project_id: '12345678-1234-1234-1234-123456789012',
      created_by: '33333333-3333-3333-3333-333333333333',
      assigned_to: '33333333-3333-3333-3333-333333333333',
      status: 'blocked',
      priority: 'medium',
      due_date: '2024-05-01',
      position: 1,
      checklist: null,
      attachments: null,
      parent_task_id: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
