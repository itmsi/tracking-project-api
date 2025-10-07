const knexConfig = require('../../../knexfile');
const knex = require('knex')(knexConfig.development);

/**
 * Script untuk menjalankan semua seeder secara berurutan
 * Pastikan migration sudah dijalankan terlebih dahulu
 */

async function runAllSeeders() {
  try {
    console.log('🌱 Memulai proses seeding database...\n');

    // Import semua seeder
    const usersSeeder = require('./0001_users_seeder');
    const teamsSeeder = require('./0002_teams_seeder');
    const projectsSeeder = require('./0003_projects_seeder');
    const tasksSeeder = require('./0004_tasks_seeder');
    const commentsSeeder = require('./0005_comments_seeder');
    const teamMembersSeeder = require('./0006_team_members_seeder');
    const projectMembersSeeder = require('./0007_project_members_seeder');
    const activityLogsSeeder = require('./0008_activity_logs_seeder');
    const notificationsSeeder = require('./0009_notifications_seeder');
    const calendarEventsSeeder = require('./0010_calendar_events_seeder');
    const systemSettingsSeeder = require('./0011_system_settings_seeder');
    const userSettingsSeeder = require('./0012_user_settings_seeder');
    const fileUploadsSeeder = require('./0013_file_uploads_seeder');
    const taskDetailsSeeder = require('./0014_task_details_seeder');
    const taskChatSeeder = require('./0015_task_chat_seeder');
    const taskAttachmentsSeeder = require('./0016_task_attachments_seeder');
    const taskMembersSeeder = require('./0017_task_members_seeder');

    // Jalankan seeder secara berurutan
    console.log('👥 Seeding users...');
    await usersSeeder.seed(knex);
    console.log('✅ Users seeded successfully\n');

    console.log('👥 Seeding teams...');
    await teamsSeeder.seed(knex);
    console.log('✅ Teams seeded successfully\n');

    console.log('📁 Seeding projects...');
    await projectsSeeder.seed(knex);
    console.log('✅ Projects seeded successfully\n');

    console.log('📋 Seeding tasks...');
    await tasksSeeder.seed(knex);
    console.log('✅ Tasks seeded successfully\n');

    console.log('💬 Seeding comments...');
    await commentsSeeder.seed(knex);
    console.log('✅ Comments seeded successfully\n');

    console.log('👥 Seeding team members...');
    await teamMembersSeeder.seed(knex);
    console.log('✅ Team members seeded successfully\n');

    console.log('👥 Seeding project members...');
    await projectMembersSeeder.seed(knex);
    console.log('✅ Project members seeded successfully\n');

    console.log('📊 Seeding activity logs...');
    await activityLogsSeeder.seed(knex);
    console.log('✅ Activity logs seeded successfully\n');

    console.log('🔔 Seeding notifications...');
    await notificationsSeeder.seed(knex);
    console.log('✅ Notifications seeded successfully\n');

    console.log('📅 Seeding calendar events...');
    await calendarEventsSeeder.seed(knex);
    console.log('✅ Calendar events seeded successfully\n');

    console.log('⚙️  Seeding system settings...');
    await systemSettingsSeeder.seed(knex);
    console.log('✅ System settings seeded successfully\n');

    console.log('👤 Seeding user settings...');
    await userSettingsSeeder.seed(knex);
    console.log('✅ User settings seeded successfully\n');

    console.log('📁 Seeding file uploads...');
    await fileUploadsSeeder.seed(knex);
    console.log('✅ File uploads seeded successfully\n');

    console.log('📋 Seeding task details...');
    await taskDetailsSeeder.seed(knex);
    console.log('✅ Task details seeded successfully\n');

    console.log('💬 Seeding task chat...');
    await taskChatSeeder.seed(knex);
    console.log('✅ Task chat seeded successfully\n');

    console.log('📎 Seeding task attachments...');
    await taskAttachmentsSeeder.seed(knex);
    console.log('✅ Task attachments seeded successfully\n');

    console.log('👥 Seeding task members...');
    await taskMembersSeeder.seed(knex);
    console.log('✅ Task members seeded successfully\n');

    console.log('🎉 Semua seeder berhasil dijalankan!');
    console.log('\n📝 Data yang tersedia:');
    console.log('   • 6 Users (admin, project_manager, developer, user, designer, tester)');
    console.log('   • 3 Teams (Development, Design, QA)');
    console.log('   • 5 Projects dengan berbagai status');
    console.log('   • 9 Tasks dengan berbagai status dan priority');
    console.log('   • 10 Comments dengan beberapa balasan');
    console.log('   • Team members untuk setiap team');
    console.log('   • Project members untuk setiap project');
    console.log('   • Activity logs untuk tracking semua aktivitas');
    console.log('   • 25+ Notifications untuk berbagai aktivitas');
    console.log('   • 20+ Calendar events (meetings, deadlines, reminders)');
    console.log('   • System settings untuk konfigurasi aplikasi');
    console.log('   • User settings untuk setiap user (theme, language, preferences)');
    console.log('   • 30+ File uploads (avatars, task attachments, project files)');
    console.log('   • Task details untuk setiap task (description, requirements, acceptance criteria)');
    console.log('   • 100+ Task chat messages dengan reply dan attachments');
    console.log('   • 50+ Task attachments (images, documents, videos, audio)');
    console.log('   • Task members dengan berbagai role dan permissions');
    
    console.log('\n🔑 Akun untuk testing:');
    console.log('   • Admin: admin@tracker.com / password123');
    console.log('   • Project Manager: manager@tracker.com / password123');
    console.log('   • Developer: developer@tracker.com / password123');
    console.log('   • User: user@tracker.com / password123');
    console.log('   • Designer: designer@tracker.com / password123');
    console.log('   • Tester: tester@tracker.com / password123');

  } catch (error) {
    console.error('❌ Error saat menjalankan seeder:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// Jalankan script jika dipanggil langsung
if (require.main === module) {
  runAllSeeders();
}

module.exports = { runAllSeeders };
