/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title').notNullable();
    table.text('description').nullable();
    table.uuid('project_id').notNullable();
    table.uuid('created_by').notNullable();
    table.uuid('assigned_to').nullable();
    table.string('status').defaultTo('todo'); // todo, in_progress, done, blocked
    table.string('priority').defaultTo('medium'); // low, medium, high, urgent
    table.date('due_date').nullable();
    table.integer('position').defaultTo(0); // for ordering in kanban board
    table.json('checklist').nullable(); // array of checklist items
    table.json('attachments').nullable(); // array of file attachments
    table.uuid('parent_task_id').nullable(); // for subtasks
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('parent_task_id').references('id').inTable('tasks').onDelete('CASCADE');
    
    // Indexes
    table.index(['project_id']);
    table.index(['created_by']);
    table.index(['assigned_to']);
    table.index(['status']);
    table.index(['priority']);
    table.index(['due_date']);
    table.index(['parent_task_id']);
    table.index(['position']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};
