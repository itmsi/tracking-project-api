/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().unique();
    
    // UI Preferences
    table.string('theme').defaultTo('light'); // light, dark, auto
    table.string('language').defaultTo('id'); // id, en
    table.string('timezone').defaultTo('Asia/Jakarta');
    table.string('date_format').defaultTo('DD/MM/YYYY'); // DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    table.string('time_format').defaultTo('24h'); // 12h, 24h
    
    // Notification Settings
    table.json('notifications').nullable(); // object with notification preferences
    
    // Dashboard Settings
    table.json('dashboard').nullable(); // object with dashboard preferences
    
    // Privacy Settings
    table.json('privacy').nullable(); // object with privacy preferences
    
    // Other Settings
    table.json('other').nullable(); // for future extensibility
    
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_settings');
};
