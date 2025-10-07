/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_chat', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    table.uuid('user_id').notNullable();
    table.text('message').notNullable();
    table.json('attachments').nullable(); // For file attachments in chat
    table.uuid('reply_to').nullable(); // For reply functionality
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('reply_to').references('id').inTable('task_chat').onDelete('SET NULL');
    
    // Indexes
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['reply_to']);
    table.index(['created_at']);
    table.index(['is_deleted']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('task_chat');
};
