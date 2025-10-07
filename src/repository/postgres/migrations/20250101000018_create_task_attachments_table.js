/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_attachments', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('file_name').notNullable();
    table.string('original_name').notNullable();
    table.string('file_path').notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type').notNullable();
    table.string('file_type').notNullable(); // image, document, video, etc.
    table.text('description').nullable();
    table.boolean('is_public').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Indexes
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['file_type']);
    table.index(['is_public']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('task_attachments');
};
