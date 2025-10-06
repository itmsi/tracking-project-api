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
