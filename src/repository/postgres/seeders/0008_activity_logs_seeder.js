/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('activity_logs').del();
  
  await knex('activity_logs').insert([
    // Task creation activities
    {
      id: '11111111-1111-1111-1111-111111111116',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'created',
      entity_type: 'task',
      entity_id: '11111111-1111-1111-1111-111111111111',
      old_values: null,
      new_values: JSON.stringify({
        title: 'Setup Database Schema',
        description: 'Membuat struktur database untuk aplikasi project tracker',
        project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        assigned_to: '33333333-3333-3333-3333-333333333333',
        status: 'todo',
        priority: 'high'
      }),
      description: 'Task "Setup Database Schema" telah dibuat dan ditugaskan ke John Developer',
      created_at: new Date('2024-01-05T09:00:00Z'),
      updated_at: new Date('2024-01-05T09:00:00Z')
    },
    {
      id: '22222222-2222-2222-2222-222222222226',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'created',
      entity_type: 'task',
      entity_id: '22222222-2222-2222-2222-222222222222',
      old_values: null,
      new_values: JSON.stringify({
        title: 'Implement Authentication',
        description: 'Membuat sistem autentikasi dengan JWT dan middleware',
        project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        assigned_to: '33333333-3333-3333-3333-333333333333',
        status: 'todo',
        priority: 'high'
      }),
      description: 'Task "Implement Authentication" telah dibuat dan ditugaskan ke John Developer',
      created_at: new Date('2024-01-10T10:30:00Z'),
      updated_at: new Date('2024-01-10T10:30:00Z')
    },
    
    // Task status updates
    {
      id: '33333333-3333-3333-3333-333333333337',
      user_id: '33333333-3333-3333-3333-333333333333',
      action: 'updated',
      entity_type: 'task',
      entity_id: '11111111-1111-1111-1111-111111111111',
      old_values: JSON.stringify({ status: 'todo' }),
      new_values: JSON.stringify({ status: 'in_progress' }),
      description: 'Status task "Setup Database Schema" diubah dari todo menjadi in_progress',
      created_at: new Date('2024-01-08T14:15:00Z'),
      updated_at: new Date('2024-01-08T14:15:00Z')
    },
    {
      id: '44444444-4444-4444-4444-444444444448',
      user_id: '33333333-3333-3333-3333-333333333333',
      action: 'updated',
      entity_type: 'task',
      entity_id: '11111111-1111-1111-1111-111111111111',
      old_values: JSON.stringify({ status: 'in_progress' }),
      new_values: JSON.stringify({ status: 'done' }),
      description: 'Status task "Setup Database Schema" diubah dari in_progress menjadi done',
      created_at: new Date('2024-01-12T16:45:00Z'),
      updated_at: new Date('2024-01-12T16:45:00Z')
    },
    {
      id: '55555555-5555-5555-5555-555555555558',
      user_id: '33333333-3333-3333-3333-333333333333',
      action: 'updated',
      entity_type: 'task',
      entity_id: '22222222-2222-2222-2222-222222222222',
      old_values: JSON.stringify({ status: 'todo' }),
      new_values: JSON.stringify({ status: 'in_progress' }),
      description: 'Status task "Implement Authentication" diubah dari todo menjadi in_progress',
      created_at: new Date('2024-01-18T11:20:00Z'),
      updated_at: new Date('2024-01-18T11:20:00Z')
    },
    
    // Project creation activities
    {
      id: '66666666-6666-6666-6666-666666666669',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'created',
      entity_type: 'project',
      entity_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      old_values: null,
      new_values: JSON.stringify({
        name: 'Project Tracker App',
        description: 'Aplikasi manajemen proyek dengan fitur task tracking, team collaboration, dan reporting',
        team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        status: 'active'
      }),
      description: 'Project "Project Tracker App" telah dibuat',
      created_at: new Date('2024-01-01T08:00:00Z'),
      updated_at: new Date('2024-01-01T08:00:00Z')
    },
    {
      id: '77777777-7777-7777-7777-777777777780',
      user_id: '22222222-2222-2222-2222-222222222222',
      action: 'created',
      entity_type: 'project',
      entity_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      old_values: null,
      new_values: JSON.stringify({
        name: 'Mobile App Redesign',
        description: 'Redesign aplikasi mobile dengan UI/UX yang lebih modern dan user-friendly',
        team_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        status: 'active'
      }),
      description: 'Project "Mobile App Redesign" telah dibuat',
      created_at: new Date('2024-02-01T09:30:00Z'),
      updated_at: new Date('2024-02-01T09:30:00Z')
    },
    
    // Team creation activities
    {
      id: '88888888-8888-8888-8888-888888888891',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'created',
      entity_type: 'team',
      entity_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      old_values: null,
      new_values: JSON.stringify({
        name: 'Development Team',
        description: 'Tim pengembangan utama untuk semua fitur aplikasi'
      }),
      description: 'Team "Development Team" telah dibuat',
      created_at: new Date('2023-12-15T10:00:00Z'),
      updated_at: new Date('2023-12-15T10:00:00Z')
    },
    {
      id: '99999999-9999-9999-9999-999999999992',
      user_id: '22222222-2222-2222-2222-222222222222',
      action: 'created',
      entity_type: 'team',
      entity_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      old_values: null,
      new_values: JSON.stringify({
        name: 'Design Team',
        description: 'Tim desain UI/UX untuk aplikasi'
      }),
      description: 'Team "Design Team" telah dibuat',
      created_at: new Date('2023-12-20T14:30:00Z'),
      updated_at: new Date('2023-12-20T14:30:00Z')
    },
    
    // Comment activities
    {
      id: '11111111-1111-1111-1111-111111111117',
      user_id: '33333333-3333-3333-3333-333333333333',
      action: 'created',
      entity_type: 'comment',
      entity_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      old_values: null,
      new_values: JSON.stringify({
        task_id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
        content: 'Database schema sudah selesai dibuat. Semua tabel utama sudah ada: users, teams, projects, tasks, dan comments.'
      }),
      description: 'Komentar ditambahkan pada task "Setup Database Schema"',
      created_at: new Date('2024-01-10T10:00:00Z'),
      updated_at: new Date('2024-01-10T10:00:00Z')
    },
    {
      id: '22222222-2222-2222-2222-222222222227',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'created',
      entity_type: 'comment',
      entity_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      old_values: null,
      new_values: JSON.stringify({
        task_id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
        parent_comment_id: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',
        content: 'Bagus! Jangan lupa tambahkan index untuk performa yang lebih baik.'
      }),
      description: 'Balasan komentar ditambahkan pada task "Setup Database Schema"',
      created_at: new Date('2024-01-10T11:30:00Z'),
      updated_at: new Date('2024-01-10T11:30:00Z')
    },
    
    // User assignment activities
    {
      id: '33333333-3333-3333-3333-333333333338',
      user_id: '11111111-1111-1111-1111-111111111111',
      action: 'assigned',
      entity_type: 'task',
      entity_id: '11111111-1111-1111-1111-111111111111',
      old_values: JSON.stringify({ assigned_to: null }),
      new_values: JSON.stringify({ assigned_to: '33333333-3333-3333-3333-333333333333' }),
      description: 'Task "Setup Database Schema" ditugaskan ke John Developer',
      created_at: new Date('2024-01-05T09:15:00Z'),
      updated_at: new Date('2024-01-05T09:15:00Z')
    },
    {
      id: '44444444-4444-4444-4444-444444444449',
      user_id: '22222222-2222-2222-2222-222222222222',
      action: 'assigned',
      entity_type: 'task',
      entity_id: '66666666-6666-6666-6666-666666666666',
      old_values: JSON.stringify({ assigned_to: null }),
      new_values: JSON.stringify({ assigned_to: '55555555-5555-5555-5555-555555555555' }),
      description: 'Task "Design New Wireframes" ditugaskan ke Alice Designer',
      created_at: new Date('2024-02-05T13:45:00Z'),
      updated_at: new Date('2024-02-05T13:45:00Z')
    }
  ]);
};
