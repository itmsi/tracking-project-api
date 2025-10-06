const { pgCore } = require('../../config/database')

class UserRepository {
  async getUsers(filters = {}) {
    const { page = 1, limit = 10, search, role } = filters
    const offset = (page - 1) * limit

    let query = pgCore('users')
      .where({ is_active: true })
      .select(['id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'last_login', 'created_at'])

    if (search) {
      query = query.where(function() {
        this.whereILike('first_name', `%${search}%`)
          .orWhereILike('last_name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
      })
    }

    if (role) {
      query = query.where({ role })
    }

    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)

    const total = await pgCore('users')
      .where({ is_active: true })
      .count('* as count')
      .first()

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total.count),
        pages: Math.ceil(total.count / limit)
      }
    }
  }

  async getUserById(id) {
    const user = await pgCore('users')
      .where({ id, is_active: true })
      .select(['id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'last_login', 'created_at', 'updated_at'])
      .first()
    
    return user
  }

  async updateUser(id, updateData) {
    const [user] = await pgCore('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'is_active', 'created_at', 'updated_at'])
    
    return user
  }

  async deleteUser(id) {
    // Soft delete
    await pgCore('users')
      .where({ id })
      .update({ is_active: false })
    
    return true
  }

  async checkUserExists(id) {
    const user = await pgCore('users')
      .where({ id, is_active: true })
      .first()
    
    return !!user
  }
}

module.exports = new UserRepository()
