/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing users for notification recipients
  const users = await knex('users').select('id').limit(5);
  
  if (users.length === 0) {
    console.log('No users found. Skipping notifications seeder.');
    return;
  }

  // Get some projects and tasks for context
  const projects = await knex('projects').select('id').limit(3);
  const tasks = await knex('tasks').select('id').limit(3);

  // Clear existing notifications
  await knex('notifications').del();

  const notifications = [];

  // Create sample notifications for each user
  users.forEach((user, index) => {
    // Task assigned notification
    if (tasks.length > 0) {
      notifications.push({
        id: knex.raw('uuid_generate_v4()'),
        user_id: user.id,
        sender_id: users[(index + 1) % users.length].id,
        title: 'Task Assigned',
        message: 'You have been assigned to a new task',
        type: 'task_assigned',
        data: JSON.stringify({
          task_id: tasks[index % tasks.length]?.id || null,
          reference_type: 'task'
        }),
        is_read: index % 3 === 0, // Some read, some unread
        read_at: index % 3 === 0 ? knex.fn.now() : null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }

    // Project update notification
    if (projects.length > 0) {
      notifications.push({
        id: knex.raw('uuid_generate_v4()'),
        user_id: user.id,
        sender_id: users[(index + 2) % users.length].id,
        title: 'Project Updated',
        message: 'A project you are member of has been updated',
        type: 'project_update',
        data: JSON.stringify({
          project_id: projects[index % projects.length]?.id || null,
          reference_type: 'project'
        }),
        is_read: index % 2 === 0,
        read_at: index % 2 === 0 ? knex.fn.now() : null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }

    // Task completed notification
    if (tasks.length > 0) {
      notifications.push({
        id: knex.raw('uuid_generate_v4()'),
        user_id: user.id,
        sender_id: users[(index + 1) % users.length].id,
        title: 'Task Completed',
        message: 'A task has been marked as completed',
        type: 'task_completed',
        data: JSON.stringify({
          task_id: tasks[index % tasks.length]?.id || null,
          reference_type: 'task'
        }),
        is_read: false, // Unread
        read_at: null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }

    // Comment notification
    notifications.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      sender_id: users[(index + 2) % users.length].id,
      title: 'New Comment',
      message: 'Someone commented on your task',
      type: 'comment',
      data: JSON.stringify({
        task_id: tasks[0]?.id || null,
        reference_type: 'task'
      }),
      is_read: false,
      read_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    // Deadline reminder
    notifications.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      sender_id: null,
      title: 'Deadline Reminder',
      message: 'A task deadline is approaching',
      type: 'deadline_reminder',
      data: JSON.stringify({
        task_id: tasks[index % tasks.length]?.id || null,
        reference_type: 'task'
      }),
      is_read: false,
      read_at: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  });

  // Insert notifications
  if (notifications.length > 0) {
    await knex('notifications').insert(notifications);
    console.log(`✓ Inserted ${notifications.length} notifications`);
  }
};

