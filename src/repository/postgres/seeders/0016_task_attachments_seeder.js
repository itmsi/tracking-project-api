/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing data
  const users = await knex('users').select('id', 'first_name', 'last_name')
  const tasks = await knex('tasks').select('id', 'title')

  if (users.length === 0 || tasks.length === 0) {
    console.log('⚠️  No users or tasks found, skipping task attachments seeder')
    return
  }

  // Clear existing task attachments
  await knex('task_attachments').del()

  const attachments = []
  
  const fileTypes = [
    { extension: 'jpg', mime: 'image/jpeg', type: 'image', size: 500000 },
    { extension: 'png', mime: 'image/png', type: 'image', size: 300000 },
    { extension: 'pdf', mime: 'application/pdf', type: 'document', size: 2000000 },
    { extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', type: 'document', size: 1500000 },
    { extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', type: 'document', size: 800000 },
    { extension: 'mp4', mime: 'video/mp4', type: 'video', size: 50000000 },
    { extension: 'mp3', mime: 'audio/mpeg', type: 'audio', size: 5000000 },
    { extension: 'zip', mime: 'application/zip', type: 'other', size: 10000000 }
  ]

  const fileNames = {
    image: ['screenshot', 'mockup', 'design', 'wireframe', 'prototype', 'ui_design', 'logo', 'icon'],
    document: ['requirements', 'specification', 'documentation', 'report', 'analysis', 'plan', 'checklist', 'guide'],
    video: ['demo', 'tutorial', 'presentation', 'walkthrough', 'recording', 'screen_capture'],
    audio: ['meeting', 'interview', 'feedback', 'discussion', 'notes'],
    other: ['backup', 'archive', 'export', 'import', 'template', 'config']
  }

  // Create sample attachments for each task
  tasks.forEach((task, taskIndex) => {
    const attachmentCount = Math.floor(Math.random() * 8) + 2 // 2-10 attachments per task
    
    for (let i = 0; i < attachmentCount; i++) {
      const userIndex = (taskIndex + i) % users.length
      const fileTypeIndex = (taskIndex * attachmentCount + i) % fileTypes.length
      const fileType = fileTypes[fileTypeIndex]
      const fileName = fileNames[fileType.type][(taskIndex + i) % fileNames[fileType.type].length]
      
      const fullFileName = `${fileName}_${taskIndex}_${i}.${fileType.extension}`
      const filePath = `/uploads/task_attachments/${task.id}/${fullFileName}`
      
      attachments.push({
        id: knex.raw('uuid_generate_v4()'),
        task_id: task.id,
        user_id: users[userIndex].id,
        file_name: fullFileName,
        original_name: `${fileName}.${fileType.extension}`,
        file_path: filePath,
        file_size: fileType.size + Math.floor(Math.random() * 100000), // Add some randomness
        mime_type: fileType.mime,
        file_type: fileType.type,
        description: `File ${fileType.type} untuk task "${task.title}" - ${fileName}`,
        is_public: Math.random() < 0.8, // 80% chance of being public
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
    }
  })

  // Insert attachments
  if (attachments.length > 0) {
    await knex('task_attachments').insert(attachments)
    console.log(`✓ Inserted ${attachments.length} task attachments`)
  }
}
