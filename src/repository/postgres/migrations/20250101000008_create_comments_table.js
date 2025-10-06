/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('comments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    table.uuid('user_id').notNullable();
    table.text('content').notNullable();
    table.uuid('parent_comment_id').nullable(); // for reply comments
    table.json('attachments').nullable(); // array of file attachments
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('parent_comment_id').references('id').inTable('comments').onDelete('CASCADE');
    
    // Indexes
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['parent_comment_id']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('comments');
};
