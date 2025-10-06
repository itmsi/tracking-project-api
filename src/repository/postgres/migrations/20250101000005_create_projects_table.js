/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('projects', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('team_id').nullable();
    table.uuid('created_by').notNullable();
    table.string('status').defaultTo('active'); // active, on_hold, completed, cancelled
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.string('color').defaultTo('#3B82F6'); // hex color for UI
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('team_id').references('id').inTable('teams').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['name']);
    table.index(['team_id']);
    table.index(['created_by']);
    table.index(['status']);
    table.index(['is_active']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('projects');
};
