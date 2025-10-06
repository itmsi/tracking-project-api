/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('action').notNullable(); // created, updated, deleted, assigned, etc.
    table.string('entity_type').notNullable(); // task, project, comment, etc.
    table.uuid('entity_id').notNullable();
    table.json('old_values').nullable(); // previous values
    table.json('new_values').nullable(); // new values
    table.text('description').nullable(); // human readable description
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['action']);
    table.index(['entity_type']);
    table.index(['entity_id']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('activity_logs');
};
