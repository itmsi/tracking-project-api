/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('projects').del();
  
  await knex('projects').insert([
    {
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      name: 'Project Tracker App',
      description: 'Aplikasi manajemen proyek dengan fitur task tracking, team collaboration, dan reporting',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      created_by: '11111111-1111-1111-1111-111111111111', // admin
      status: 'active',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      color: '#3B82F6',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      name: 'Mobile App Redesign',
      description: 'Redesign aplikasi mobile dengan UI/UX yang lebih modern dan user-friendly',
      team_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Design Team
      created_by: '22222222-2222-2222-2222-222222222222', // project manager
      status: 'active',
      start_date: '2024-02-01',
      end_date: '2024-06-30',
      color: '#10B981',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      name: 'API Testing Suite',
      description: 'Membangun comprehensive testing suite untuk semua API endpoints',
      team_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // QA Team
      created_by: '11111111-1111-1111-1111-111111111111', // admin
      status: 'active',
      start_date: '2024-03-01',
      end_date: '2024-08-31',
      color: '#F59E0B',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '12345678-1234-1234-1234-123456789012',
      name: 'Database Optimization',
      description: 'Optimasi database untuk meningkatkan performa aplikasi',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      created_by: '33333333-3333-3333-3333-333333333333', // developer
      status: 'on_hold',
      start_date: '2024-04-01',
      end_date: '2024-09-30',
      color: '#EF4444',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '87654321-4321-4321-4321-210987654321',
      name: 'User Documentation',
      description: 'Membuat dokumentasi lengkap untuk pengguna aplikasi',
      team_id: null, // No specific team
      created_by: '44444444-4444-4444-4444-444444444444', // user
      status: 'completed',
      start_date: '2024-01-15',
      end_date: '2024-02-28',
      color: '#8B5CF6',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
