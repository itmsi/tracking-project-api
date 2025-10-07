/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing users and projects
  const users = await knex('users').select('id', 'first_name', 'last_name').limit(3);
  const projects = await knex('projects').select('id', 'name').limit(3);

  if (users.length === 0) {
    console.log('No users found. Skipping calendar events seeder.');
    return;
  }

  // Clear existing calendar events
  await knex('calendar_events').del();

  const events = [];
  const now = new Date();

  // Helper function to add days
  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  // Helper function to set time
  const setTime = (date, hours, minutes = 0) => {
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  // Create various types of events
  users.forEach((user, userIndex) => {
    // Past event - Sprint Planning
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Sprint Planning',
      description: 'Planning meeting for the upcoming sprint',
      start_date: setTime(addDays(now, -7), 9, 0),
      end_date: setTime(addDays(now, -7), 11, 0),
      type: 'meeting',
      location: 'Meeting Room A',
      project_id: projects[userIndex % projects.length]?.id || null,
      creator_id: user.id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Today's event - Daily Standup
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Daily Standup',
      description: 'Daily team synchronization meeting',
      start_date: setTime(now, 10, 0),
      end_date: setTime(now, 10, 15),
      type: 'meeting',
      location: 'Virtual - Zoom',
      project_id: projects[userIndex % projects.length]?.id || null,
      creator_id: user.id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Tomorrow's event - Code Review
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Code Review Session',
      description: 'Review pull requests and discuss code improvements',
      start_date: setTime(addDays(now, 1), 14, 0),
      end_date: setTime(addDays(now, 1), 15, 30),
      type: 'meeting',
      location: 'Meeting Room B',
      project_id: projects[userIndex % projects.length]?.id || null,
      creator_id: user.id,
      attendees: JSON.stringify([user.id]),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Next week - Sprint Demo
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Sprint Demo',
      description: 'Demonstrate completed features to stakeholders',
      start_date: setTime(addDays(now, 7), 15, 0),
      end_date: setTime(addDays(now, 7), 16, 0),
      type: 'meeting',
      location: 'Main Conference Room',
      project_id: projects[userIndex % projects.length]?.id || null,
      creator_id: user.id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Deadline event
    if (projects.length > 0) {
      events.push({
        id: knex.raw('uuid_generate_v4()'),
        title: `${projects[userIndex % projects.length]?.name || 'Project'} Deadline`,
        description: 'Final submission deadline for the project',
        start_date: setTime(addDays(now, 14), 17, 0),
        end_date: setTime(addDays(now, 14), 17, 0),
        type: 'deadline',
        location: null,
        project_id: projects[userIndex % projects.length]?.id || null,
        creator_id: user.id,
        attendees: JSON.stringify([user.id]),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  });

  // Common team events
  if (projects.length > 0 && users.length > 0) {
    // Monthly Review Meeting
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Monthly Review Meeting',
      description: 'Review monthly progress and set goals',
      start_date: setTime(addDays(now, 3), 13, 0),
      end_date: setTime(addDays(now, 3), 14, 30),
      type: 'meeting',
      location: 'Main Conference Room',
      project_id: projects[0].id,
      creator_id: users[0].id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Team Building Activity
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Team Building Activity',
      description: 'Fun team building exercises and games',
      start_date: setTime(addDays(now, 5), 16, 0),
      end_date: setTime(addDays(now, 5), 18, 0),
      type: 'other',
      location: 'Office Lounge',
      project_id: null,
      creator_id: users[0].id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Reminder - Submit Timesheet
    events.push({
      id: knex.raw('uuid_generate_v4()'),
      title: 'Submit Timesheet',
      description: 'Reminder to submit weekly timesheet',
      start_date: setTime(addDays(now, 4), 17, 0),
      end_date: setTime(addDays(now, 4), 17, 0),
      type: 'reminder',
      location: null,
      project_id: null,
      creator_id: users[0].id,
      attendees: JSON.stringify(users.map(u => u.id)),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  }

  // Insert events
  if (events.length > 0) {
    await knex('calendar_events').insert(events);
    console.log(`✓ Inserted ${events.length} calendar events`);
  }
};

