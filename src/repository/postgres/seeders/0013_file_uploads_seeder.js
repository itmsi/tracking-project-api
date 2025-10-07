/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Get existing users, projects, and tasks
  const users = await knex('users').select('id').limit(5);
  const projects = await knex('projects').select('id').limit(3);
  const tasks = await knex('tasks').select('id').limit(5);

  if (users.length === 0) {
    console.log('No users found. Skipping file uploads seeder.');
    return;
  }

  // Clear existing file uploads
  await knex('file_uploads').del();

  const uploads = [];

  // File types and extensions
  const fileTypes = [
    { type: 'avatar', extension: 'jpg', mime: 'image/jpeg', size: 150000 },
    { type: 'avatar', extension: 'png', mime: 'image/png', size: 200000 },
    { type: 'task_attachment', extension: 'pdf', mime: 'application/pdf', size: 500000 },
    { type: 'task_attachment', extension: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 300000 },
    { type: 'task_attachment', extension: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 250000 },
    { type: 'project_file', extension: 'zip', mime: 'application/zip', size: 1500000 },
    { type: 'project_file', extension: 'png', mime: 'image/png', size: 800000 },
  ];

  // Sample file names
  const fileNames = {
    avatar: ['profile-photo', 'avatar', 'user-image'],
    task_attachment: ['requirements', 'specification', 'design-mockup', 'documentation', 'report'],
    project_file: ['project-files', 'source-code', 'assets', 'documentation', 'presentation']
  };

  // Create sample uploads for users (avatars)
  users.forEach((user, index) => {
    const fileInfo = fileTypes[index % 2]; // jpg or png for avatars
    const fileName = fileNames.avatar[index % fileNames.avatar.length];
    
    uploads.push({
      id: knex.raw('uuid_generate_v4()'),
      file_name: `${fileName}-${user.id}.${fileInfo.extension}`,
      original_name: `${fileName}.${fileInfo.extension}`,
      file_path: `/uploads/avatars/${user.id}/${fileName}.${fileInfo.extension}`,
      file_size: fileInfo.size,
      mime_type: fileInfo.mime,
      type: 'avatar',
      user_id: user.id,
      task_id: null,
      project_id: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  });

  // Create sample task attachments
  if (tasks.length > 0) {
    tasks.forEach((task, index) => {
      // Add 2-3 attachments per task
      const numAttachments = 2 + (index % 2);
      
      for (let i = 0; i < numAttachments; i++) {
        const fileInfo = fileTypes[2 + (i % 3)]; // pdf, docx, xlsx
        const fileName = fileNames.task_attachment[i % fileNames.task_attachment.length];
        const uploadedBy = users[index % users.length].id;
        
        uploads.push({
          id: knex.raw('uuid_generate_v4()'),
          file_name: `${fileName}-${task.id}-${i}.${fileInfo.extension}`,
          original_name: `${fileName}.${fileInfo.extension}`,
          file_path: `/uploads/tasks/${task.id}/${fileName}-${i}.${fileInfo.extension}`,
          file_size: fileInfo.size,
          mime_type: fileInfo.mime,
          type: 'task_attachment',
          user_id: uploadedBy,
          task_id: task.id,
          project_id: null,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      }
    });
  }

  // Create sample project files
  if (projects.length > 0) {
    projects.forEach((project, index) => {
      // Add 3-4 files per project
      const numFiles = 3 + (index % 2);
      
      for (let i = 0; i < numFiles; i++) {
        const fileInfo = fileTypes[5 + (i % 2)]; // zip or png
        const fileName = fileNames.project_file[i % fileNames.project_file.length];
        const uploadedBy = users[index % users.length].id;
        
        uploads.push({
          id: knex.raw('uuid_generate_v4()'),
          file_name: `${fileName}-${project.id}-${i}.${fileInfo.extension}`,
          original_name: `${fileName}.${fileInfo.extension}`,
          file_path: `/uploads/projects/${project.id}/${fileName}-${i}.${fileInfo.extension}`,
          file_size: fileInfo.size,
          mime_type: fileInfo.mime,
          type: 'project_file',
          user_id: uploadedBy,
          task_id: null,
          project_id: project.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now()
        });
      }
    });
  }

  // Add some general uploads (not linked to specific entities)
  users.slice(0, 2).forEach((user, index) => {
    const fileInfo = fileTypes[2 + index]; // pdf or docx
    
    uploads.push({
      id: knex.raw('uuid_generate_v4()'),
      file_name: `general-document-${index}.${fileInfo.extension}`,
      original_name: `document-${index}.${fileInfo.extension}`,
      file_path: `/uploads/general/${user.id}/document-${index}.${fileInfo.extension}`,
      file_size: fileInfo.size,
      mime_type: fileInfo.mime,
      type: 'general',
      user_id: user.id,
      task_id: null,
      project_id: null,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  });

  // Insert uploads
  if (uploads.length > 0) {
    await knex('file_uploads').insert(uploads);
    console.log(`✓ Inserted ${uploads.length} file uploads`);
  }
};

