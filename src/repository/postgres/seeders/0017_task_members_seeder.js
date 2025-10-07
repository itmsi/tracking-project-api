/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing data
  const users = await knex('users').select('id', 'first_name', 'last_name')
  const tasks = await knex('tasks').select('id', 'title', 'created_by')

  if (users.length === 0 || tasks.length === 0) {
    console.log('⚠️  No users or tasks found, skipping task members seeder')
    return
  }

  // Clear existing task members
  await knex('task_members').del()

  const taskMembers = []
  const roles = ['owner', 'admin', 'member', 'viewer']

  // Create sample task members for each task
  tasks.forEach((task, taskIndex) => {
    // Add task creator as owner
    taskMembers.push({
      id: knex.raw('uuid_generate_v4()'),
      task_id: task.id,
      user_id: task.created_by,
      role: 'owner',
      can_edit: true,
      can_comment: true,
      can_upload: true,
      added_by: task.created_by,
      joined_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    })

    // Add 2-5 additional members per task
    const memberCount = Math.floor(Math.random() * 4) + 2 // 2-5 additional members
    const availableUsers = users.filter(user => user.id !== task.created_by)
    
    for (let i = 0; i < memberCount && i < availableUsers.length; i++) {
      const userIndex = (taskIndex + i) % availableUsers.length
      const user = availableUsers[userIndex]
      const role = roles[Math.floor(Math.random() * (roles.length - 1)) + 1] // Exclude 'owner'
      
      // Set permissions based on role
      let canEdit = true
      let canComment = true
      let canUpload = true
      
      if (role === 'viewer') {
        canEdit = false
        canComment = false
        canUpload = false
      } else if (role === 'member') {
        canEdit = Math.random() < 0.7 // 70% chance
        canComment = true
        canUpload = Math.random() < 0.8 // 80% chance
      } else if (role === 'admin') {
        canEdit = true
        canComment = true
        canUpload = true
      }

      taskMembers.push({
        id: knex.raw('uuid_generate_v4()'),
        task_id: task.id,
        user_id: user.id,
        role: role,
        can_edit: canEdit,
        can_comment: canComment,
        can_upload: canUpload,
        added_by: task.created_by,
        joined_at: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
    }
  })

  // Insert task members
  if (taskMembers.length > 0) {
    await knex('task_members').insert(taskMembers)
    console.log(`✓ Inserted ${taskMembers.length} task members`)
  }
}
