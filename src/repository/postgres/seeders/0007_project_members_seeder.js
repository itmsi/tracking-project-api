/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('project_members').del();
  
  await knex('project_members').insert([
    // Project Tracker App Members
    {
      id: '11111111-1111-1111-1111-111111111113',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Project Tracker App
      user_id: '11111111-1111-1111-1111-111111111111', // admin
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222224',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Project Tracker App
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333335',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Project Tracker App
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '44444444-4444-4444-4444-444444444446',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Project Tracker App
      user_id: '44444444-4444-4444-4444-444444444444', // user
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '55555555-5555-5555-5555-555555555556',
      project_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', // Project Tracker App
      user_id: '66666666-6666-6666-6666-666666666666', // tester
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Mobile App Redesign Members
    {
      id: '66666666-6666-6666-6666-666666666667',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Mobile App Redesign
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '77777777-7777-7777-7777-777777777778',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Mobile App Redesign
      user_id: '55555555-5555-5555-5555-555555555555', // designer
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '88888888-8888-8888-8888-888888888889',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Mobile App Redesign
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '99999999-9999-9999-9999-999999999990',
      project_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', // Mobile App Redesign
      user_id: '44444444-4444-4444-4444-444444444444', // user
      role: 'viewer',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // API Testing Suite Members
    {
      id: '11111111-1111-1111-1111-111111111114',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // API Testing Suite
      user_id: '11111111-1111-1111-1111-111111111111', // admin
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '22222222-2222-2222-2222-222222222225',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // API Testing Suite
      user_id: '66666666-6666-6666-6666-666666666666', // tester
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '33333333-3333-3333-3333-333333333336',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // API Testing Suite
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '44444444-4444-4444-4444-444444444447',
      project_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // API Testing Suite
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Database Optimization Members
    {
      id: '55555555-5555-5555-5555-555555555557',
      project_id: '12345678-1234-1234-1234-123456789012', // Database Optimization
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '66666666-6666-6666-6666-666666666668',
      project_id: '12345678-1234-1234-1234-123456789012', // Database Optimization
      user_id: '11111111-1111-1111-1111-111111111111', // admin
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '77777777-7777-7777-7777-777777777779',
      project_id: '12345678-1234-1234-1234-123456789012', // Database Optimization
      user_id: '66666666-6666-6666-6666-666666666666', // tester
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // User Documentation Members
    {
      id: '88888888-8888-8888-8888-888888888890',
      project_id: '87654321-4321-4321-4321-210987654321', // User Documentation
      user_id: '44444444-4444-4444-4444-444444444444', // user
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '99999999-9999-9999-9999-999999999991',
      project_id: '87654321-4321-4321-4321-210987654321', // User Documentation
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '11111111-1111-1111-1111-111111111115',
      project_id: '87654321-4321-4321-4321-210987654321', // User Documentation
      user_id: '55555555-5555-5555-5555-555555555555', // designer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
