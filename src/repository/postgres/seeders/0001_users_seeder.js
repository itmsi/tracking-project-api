const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash password untuk semua user
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  await knex('users').insert([
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@tracker.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'System',
      role: 'admin',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'manager@tracker.com',
      password: hashedPassword,
      first_name: 'Project',
      last_name: 'Manager',
      role: 'project_manager',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'developer@tracker.com',
      password: hashedPassword,
      first_name: 'John',
      last_name: 'Developer',
      role: 'developer',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'user@tracker.com',
      password: hashedPassword,
      first_name: 'Jane',
      last_name: 'User',
      role: 'user',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'designer@tracker.com',
      password: hashedPassword,
      first_name: 'Alice',
      last_name: 'Designer',
      role: 'developer',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      email: 'tester@tracker.com',
      password: hashedPassword,
      first_name: 'Bob',
      last_name: 'Tester',
      role: 'developer',
      avatar_url: null,
      is_active: true,
      last_login: null,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
