/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing users
  const users = await knex('users').select('id', 'email');

  if (users.length === 0) {
    console.log('No users found. Skipping user settings seeder.');
    return;
  }

  // Clear existing user settings
  await knex('user_settings').del();

  const settings = [];

  // Theme variations
  const themes = ['light', 'dark', 'auto'];
  const languages = ['en', 'id'];
  const timezones = ['Asia/Jakarta', 'Asia/Singapore', 'UTC', 'America/New_York'];

  // Create settings for each user
  users.forEach((user, index) => {
    const notificationSettings = {
      email: true,
      push: index % 2 === 0, // Some users have push enabled
      in_app: true,
      task_assigned: true,
      task_completed: true,
      task_updated: index % 3 !== 0,
      comment_added: true,
      project_updated: true,
      deadline_reminder: true,
      reminder_before_hours: 24
    };

    const dashboardSettings = {
      show_projects: true,
      show_tasks: true,
      show_calendar: true,
      show_activity: index % 2 === 0,
      show_analytics: index % 3 === 0,
      default_view: index % 2 === 0 ? 'kanban' : 'list',
      items_per_page: 20,
      auto_refresh: true,
      refresh_interval: 30
    };

    const privacySettings = {
      profile_visibility: 'team', // 'public', 'team', 'private'
      show_email: false,
      show_activity: true,
      allow_mentions: true,
      allow_notifications: true
    };

    const displaySettings = {
      compact_view: false,
      show_avatars: true,
      show_descriptions: true,
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      first_day_of_week: index % 2 === 0 ? 'monday' : 'sunday'
    };

    settings.push({
      id: knex.raw('uuid_generate_v4()'),
      user_id: user.id,
      theme: themes[index % themes.length],
      language: languages[index % languages.length],
      timezone: timezones[index % timezones.length],
      date_format: displaySettings.date_format,
      time_format: displaySettings.time_format,
      notifications: JSON.stringify(notificationSettings),
      dashboard: JSON.stringify(dashboardSettings),
      privacy: JSON.stringify(privacySettings),
      other: JSON.stringify(displaySettings),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  });

  // Insert settings
  if (settings.length > 0) {
    await knex('user_settings').insert(settings);
    console.log(`✓ Inserted ${settings.length} user settings`);
  }
};

