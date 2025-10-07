/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.uuid('sender_id').nullable();
    table.string('type').notNullable(); // task_assigned, task_completed, comment_added, etc.
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.json('data').nullable(); // additional data like task_id, project_id, etc.
    table.boolean('is_read').defaultTo(false);
    table.timestamp('read_at').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('sender_id').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['user_id']);
    table.index(['user_id', 'is_read']);
    table.index(['user_id', 'is_active']);
    table.index(['created_at']);
    table.index(['type']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notifications');
};
