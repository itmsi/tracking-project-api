/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('team_members').del();
  
  await knex('team_members').insert([
    // Development Team Members
    {
      id: 'dddddddd-1111-1111-1111-111111111111',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      user_id: '11111111-1111-1111-1111-111111111111', // admin
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'dddddddd-2222-2222-2222-222222222222',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'dddddddd-3333-3333-3333-333333333333',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'dddddddd-4444-4444-4444-444444444444',
      team_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // Development Team
      user_id: '44444444-4444-4444-4444-444444444444', // user
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // Design Team Members
    {
      id: 'eeeeeeee-1111-1111-1111-111111111111',
      team_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Design Team
      user_id: '22222222-2222-2222-2222-222222222222', // project manager
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'eeeeeeee-2222-2222-2222-222222222222',
      team_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Design Team
      user_id: '55555555-5555-5555-5555-555555555555', // designer
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'eeeeeeee-3333-3333-3333-333333333333',
      team_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // Design Team
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    
    // QA Team Members
    {
      id: 'ffffffff-1111-1111-1111-111111111111',
      team_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // QA Team
      user_id: '11111111-1111-1111-1111-111111111111', // admin
      role: 'owner',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'ffffffff-2222-2222-2222-222222222222',
      team_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // QA Team
      user_id: '66666666-6666-6666-6666-666666666666', // tester
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'ffffffff-3333-3333-3333-333333333333',
      team_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // QA Team
      user_id: '33333333-3333-3333-3333-333333333333', // developer
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'ffffffff-4444-4444-4444-444444444444',
      team_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // QA Team
      user_id: '44444444-4444-4444-4444-444444444444', // user
      role: 'member',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
