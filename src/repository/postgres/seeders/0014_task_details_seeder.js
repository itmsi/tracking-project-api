/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing data
  const users = await knex('users').select('id', 'first_name', 'last_name')
  const tasks = await knex('tasks').select('id', 'title', 'created_by')

  if (users.length === 0 || tasks.length === 0) {
    console.log('⚠️  No users or tasks found, skipping task details seeder')
    return
  }

  // Clear existing task details
  await knex('task_details').del()

  const taskDetails = []

  // Create sample task details for each task
  tasks.forEach((task, index) => {
    const detailTypes = [
      {
        description: `Detail lengkap untuk task "${task.title}". Task ini mencakup berbagai aspek penting yang perlu diperhatikan selama pengembangan.`,
        requirements: `1. Implementasi fitur utama sesuai spesifikasi\n2. Testing yang komprehensif\n3. Dokumentasi yang lengkap\n4. Performance optimization\n5. Security considerations`,
        acceptance_criteria: `1. Semua fitur berfungsi sesuai requirement\n2. Unit test coverage minimal 80%\n3. Integration test berhasil\n4. Performance test memenuhi standar\n5. Security audit passed`,
        metadata: {
          priority: ['high', 'medium', 'low'][index % 3],
          complexity: ['simple', 'moderate', 'complex'][index % 3],
          estimated_hours: [8, 16, 32][index % 3],
          tags: ['frontend', 'backend', 'database', 'api', 'ui/ux'][index % 5]
        }
      },
      {
        description: `Task "${task.title}" memerlukan perhatian khusus pada aspek teknis dan bisnis. Pastikan semua stakeholder terlibat dalam proses pengembangan.`,
        requirements: `1. Analisis kebutuhan bisnis\n2. Desain sistem yang scalable\n3. Implementasi dengan best practices\n4. Code review yang ketat\n5. Deployment yang aman`,
        acceptance_criteria: `1. Business requirements terpenuhi\n2. System design approved\n3. Code quality score > 8/10\n4. All tests passing\n5. Production deployment successful`,
        metadata: {
          priority: 'high',
          complexity: 'moderate',
          estimated_hours: 24,
          tags: ['analysis', 'design', 'implementation', 'testing', 'deployment']
        }
      }
    ]

    const detailType = detailTypes[index % detailTypes.length]
    
    taskDetails.push({
      id: knex.raw('uuid_generate_v4()'),
      task_id: task.id,
      description: detailType.description,
      requirements: detailType.requirements,
      acceptance_criteria: detailType.acceptance_criteria,
      metadata: JSON.stringify(detailType.metadata),
      created_by: task.created_by,
      updated_by: users[index % users.length].id,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })
  })

  // Insert task details
  if (taskDetails.length > 0) {
    await knex('task_details').insert(taskDetails)
    console.log(`✓ Inserted ${taskDetails.length} task details`)
  }
}
