/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_members', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    table.uuid('user_id').notNullable();
    table.string('role').notNullable().defaultTo('member'); // owner, admin, member, viewer
    table.boolean('can_edit').defaultTo(true);
    table.boolean('can_comment').defaultTo(true);
    table.boolean('can_upload').defaultTo(true);
    table.uuid('added_by').notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('added_by').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint - one user per task
    table.unique(['task_id', 'user_id']);
    
    // Indexes
    table.index(['task_id']);
    table.index(['user_id']);
    table.index(['role']);
    table.index(['added_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('task_members');
};
