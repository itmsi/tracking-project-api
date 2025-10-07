/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_details', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    table.text('description').nullable();
    table.text('requirements').nullable();
    table.text('acceptance_criteria').nullable();
    table.json('metadata').nullable(); // For additional custom fields
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
    // Indexes
    table.index(['task_id']);
    table.index(['created_by']);
    table.index(['updated_by']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('task_details');
};
