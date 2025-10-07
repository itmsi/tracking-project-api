/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing data
  const users = await knex('users').select('id', 'first_name', 'last_name')
  const tasks = await knex('tasks').select('id', 'title')

  if (users.length === 0 || tasks.length === 0) {
    console.log('⚠️  No users or tasks found, skipping task chat seeder')
    return
  }

  // Clear existing task chat
  await knex('task_chat').del()

  const chatMessages = []
  const messages = [
    "Halo semua! Task ini sudah siap untuk dikerjakan. Ada yang mau mulai?",
    "Saya akan handle bagian frontend, siapa yang mau handle backend?",
    "Oke, saya handle backend. Kita mulai dari API endpoints dulu ya.",
    "Baik, saya sudah buat mockup untuk UI. Bisa dilihat di attachment.",
    "API endpoints sudah selesai, bisa di-test sekarang.",
    "Frontend sudah 80% selesai, tinggal integration dengan API.",
    "Ada bug di bagian login, perlu di-fix dulu.",
    "Bug sudah di-fix, bisa di-test lagi.",
    "Testing sudah selesai, semua fitur berfungsi dengan baik.",
    "Ready for deployment! 🚀",
    "Deployment berhasil, aplikasi sudah live!",
    "Terima kasih semua untuk kerjasamanya! 👍",
    "Ada feedback dari user, perlu improvement di UX.",
    "Saya akan buat improvement untuk UX.",
    "Improvement sudah selesai, bisa di-review.",
    "Review selesai, semua oke!",
    "Task completed successfully! 🎉"
  ]

  // Create sample chat messages for each task
  tasks.forEach((task, taskIndex) => {
    const messageCount = Math.floor(Math.random() * 10) + 5 // 5-15 messages per task
    
    for (let i = 0; i < messageCount; i++) {
      const userIndex = (taskIndex + i) % users.length
      const messageIndex = (taskIndex * messageCount + i) % messages.length
      const user = users[userIndex]
      
      // Some messages have attachments
      const hasAttachments = Math.random() < 0.2 // 20% chance
      const attachments = hasAttachments ? [
        {
          type: 'file',
          name: `attachment_${taskIndex}_${i}.pdf`,
          url: `/uploads/task_attachments/${task.id}/attachment_${taskIndex}_${i}.pdf`,
          size: Math.floor(Math.random() * 1000000) + 100000 // 100KB - 1MB
        }
      ] : null

      // Some messages are replies (simplified to avoid UUID reference issues)
      const isReply = i > 0 && Math.random() < 0.3 // 30% chance after first message
      const replyTo = null // Simplified for seeding

      chatMessages.push({
        id: knex.raw('uuid_generate_v4()'),
        task_id: task.id,
        user_id: user.id,
        message: messages[messageIndex],
        attachments: attachments ? JSON.stringify(attachments) : null,
        reply_to: replyTo,
        is_edited: Math.random() < 0.1, // 10% chance of being edited
        edited_at: Math.random() < 0.1 ? knex.fn.now() : null,
        is_deleted: false,
        deleted_at: null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      })
    }
  })

  // Insert chat messages
  if (chatMessages.length > 0) {
    await knex('task_chat').insert(chatMessages)
    console.log(`✓ Inserted ${chatMessages.length} task chat messages`)
  }
}
