/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('comments', function(table) {
    // Add project_id column
    table.uuid('project_id').nullable().after('task_id');
    
    // Add foreign key constraint
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    
    // Add index
    table.index(['project_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('comments', function(table) {
    // Drop index
    table.dropIndex(['project_id']);
    
    // Drop foreign key constraint
    table.dropForeign(['project_id']);
    
    // Drop column
    table.dropColumn('project_id');
  });
};
