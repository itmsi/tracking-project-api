const { response } = require('../../utils')
const projectRepository = require('./postgre_repository')
const { createActivityLog } = require('../../utils/activity_logger')

class ProjectHandler {
  async getProjects(req, res, next) {
    try {
      const userId = req.user.id
      const filters = {
        ...req.query,
        user_id: userId
      }

      const result = await projectRepository.getProjects(filters)
      
      return response.success(res, 200, 'Daftar project berhasil diambil', result)
    } catch (error) {
      next(error)
    }
  }

  async createProject(req, res, next) {
    try {
      const userId = req.user.id
      const projectData = {
        ...req.body,
        created_by: userId
      }

      const project = await projectRepository.createProject(projectData)

      // Add creator as project owner
      await projectRepository.addProjectMember(project.id, userId, 'owner')

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'created',
        entity_type: 'project',
        entity_id: project.id,
        new_values: project,
        description: `Project "${project.name}" dibuat`
      })

      return response.success(res, 201, 'Project berhasil dibuat', project)
    } catch (error) {
      next(error)
    }
  }

  async getProject(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      const project = await projectRepository.getProjectById(id, userId)
      if (!project) {
        return response.error(res, 404, 'Project tidak ditemukan')
      }

      return response.success(res, 200, 'Project berhasil diambil', project)
    } catch (error) {
      next(error)
    }
  }

  async updateProject(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const updateData = req.body

      // Get old project data for activity log
      const oldProject = await projectRepository.getProjectById(id, userId)
      if (!oldProject) {
        return response.error(res, 404, 'Project tidak ditemukan')
      }

      const project = await projectRepository.updateProject(id, updateData, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated',
        entity_type: 'project',
        entity_id: id,
        old_values: oldProject,
        new_values: project,
        description: `Project "${project.name}" diperbarui`
      })

      return response.success(res, 200, 'Project berhasil diperbarui', project)
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async deleteProject(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Get project data for activity log
      const project = await projectRepository.getProjectById(id, userId)
      if (!project) {
        return response.error(res, 404, 'Project tidak ditemukan')
      }

      await projectRepository.deleteProject(id, userId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'deleted',
        entity_type: 'project',
        entity_id: id,
        old_values: project,
        description: `Project "${project.name}" dihapus`
      })

      return response.success(res, 200, 'Project berhasil dihapus')
    } catch (error) {
      if (error.message.includes('Tidak memiliki akses')) {
        return response.error(res, 403, error.message)
      }
      next(error)
    }
  }

  async getProjectMembers(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Check if user has access to project
      const project = await projectRepository.getProjectById(id, userId)
      if (!project) {
        return response.error(res, 404, 'Project tidak ditemukan')
      }

      const members = await projectRepository.getProjectMembers(id)
      
      return response.success(res, 200, 'Daftar member project berhasil diambil', members)
    } catch (error) {
      next(error)
    }
  }

  async addProjectMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params
      const { user_id, role } = req.body

      // Check if user has permission to add members
      const hasPermission = await projectRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menambah member')
      }

      const member = await projectRepository.addProjectMember(id, user_id, role)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'added_member',
        entity_type: 'project',
        entity_id: id,
        new_values: { user_id, role },
        description: `Member ditambahkan ke project`
      })

      return response.success(res, 201, 'Member berhasil ditambahkan', member)
    } catch (error) {
      if (error.message.includes('sudah menjadi member')) {
        return response.error(res, 400, error.message)
      }
      next(error)
    }
  }

  async updateProjectMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, userId: memberUserId } = req.params
      const { role } = req.body

      // Check if user has permission to update members
      const hasPermission = await projectRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk mengubah member')
      }

      const member = await projectRepository.updateProjectMember(id, memberUserId, role)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'updated_member',
        entity_type: 'project',
        entity_id: id,
        new_values: { user_id: memberUserId, role },
        description: `Role member diubah menjadi ${role}`
      })

      return response.success(res, 200, 'Member berhasil diperbarui', member)
    } catch (error) {
      next(error)
    }
  }

  async removeProjectMember(req, res, next) {
    try {
      const userId = req.user.id
      const { id, userId: memberUserId } = req.params

      // Check if user has permission to remove members
      const hasPermission = await projectRepository.checkUserPermission(id, userId, ['owner', 'admin'])
      if (!hasPermission) {
        return response.error(res, 403, 'Tidak memiliki akses untuk menghapus member')
      }

      await projectRepository.removeProjectMember(id, memberUserId)

      // Create activity log
      await createActivityLog({
        user_id: userId,
        action: 'removed_member',
        entity_type: 'project',
        entity_id: id,
        new_values: { user_id: memberUserId },
        description: `Member dihapus dari project`
      })

      return response.success(res, 200, 'Member berhasil dihapus')
    } catch (error) {
      next(error)
    }
  }

  async getProjectStats(req, res, next) {
    try {
      const userId = req.user.id
      const { id } = req.params

      // Check if user has access to project
      const project = await projectRepository.getProjectById(id, userId)
      if (!project) {
        return response.error(res, 404, 'Project tidak ditemukan')
      }

      const stats = await projectRepository.getProjectStats(id)
      
      return response.success(res, 200, 'Statistik project berhasil diambil', stats)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new ProjectHandler()
