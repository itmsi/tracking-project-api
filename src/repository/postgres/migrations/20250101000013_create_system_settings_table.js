/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key').notNullable().unique();
    table.text('value').notNullable();
    table.string('type').notNullable(); // string, number, boolean, json
    table.text('description').nullable();
    table.string('category').defaultTo('general'); // general, email, security, etc.
    table.uuid('updated_by').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['key']);
    table.index(['category']);
    table.index(['is_active']);
    table.index(['updated_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('system_settings');
};
