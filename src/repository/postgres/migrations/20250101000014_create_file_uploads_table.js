/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('file_uploads', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('original_name').notNullable();
    table.string('file_name').notNullable();
    table.string('file_path').notNullable();
    table.bigInteger('file_size').notNullable();
    table.string('mime_type').notNullable();
    table.string('type').notNullable(); // avatar, task_attachment, project_file, general
    table.text('description').nullable();
    table.uuid('task_id').nullable();
    table.uuid('project_id').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    
    // Indexes
    table.index(['user_id']);
    table.index(['type']);
    table.index(['task_id']);
    table.index(['project_id']);
    table.index(['mime_type']);
    table.index(['is_active']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('file_uploads');
};
