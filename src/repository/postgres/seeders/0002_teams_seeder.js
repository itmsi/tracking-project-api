/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('teams').del();
  
  await knex('teams').insert([
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Development Team',
      description: 'Tim pengembangan utama untuk semua fitur aplikasi',
      created_by: '11111111-1111-1111-1111-111111111111', // admin
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Design Team',
      description: 'Tim desain UI/UX untuk aplikasi',
      created_by: '22222222-2222-2222-2222-222222222222', // project manager
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'QA Team',
      description: 'Tim Quality Assurance untuk testing aplikasi',
      created_by: '11111111-1111-1111-1111-111111111111', // admin
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};
