/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('calendar_events', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('creator_id').notNullable();
    table.uuid('project_id').nullable();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.string('type').defaultTo('meeting'); // meeting, deadline, milestone, other
    table.json('attendees').nullable(); // array of user IDs
    table.string('location').nullable();
    table.boolean('is_all_day').defaultTo(false);
    table.string('recurrence_rule').nullable(); // for recurring events
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    
    // Indexes
    table.index(['creator_id']);
    table.index(['project_id']);
    table.index(['start_date']);
    table.index(['end_date']);
    table.index(['type']);
    table.index(['is_active']);
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('calendar_events');
};
