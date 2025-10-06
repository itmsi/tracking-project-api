const { pgCore } = require('../../config/database')
const bcrypt = require('bcrypt')

class AuthRepository {
  async createUser(userData) {
    const { email, password, first_name, last_name, role = 'user' } = userData
    
    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    
    const [user] = await pgCore('users')
      .insert({
        email,
        password: hashedPassword,
        first_name,
        last_name,
        role
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'avatar_url', 'is_active', 'created_at', 'updated_at'])
    
    return user
  }

  async findUserByEmail(email) {
    const user = await pgCore('users')
      .where({ email, is_active: true })
      .first()
    
    return user
  }

  async findUserById(id) {
    const user = await pgCore('users')
      .where({ id, is_active: true })
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

  async updatePassword(id, newPassword) {
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)
    
    await pgCore('users')
      .where({ id })
      .update({ 
        password: hashedPassword,
        updated_at: new Date()
      })
    
    return true
  }

  async updateLastLogin(id) {
    await pgCore('users')
      .where({ id })
      .update({ 
        last_login: new Date(),
        updated_at: new Date()
      })
    
    return true
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  async checkEmailExists(email, excludeId = null) {
    let query = pgCore('users').where({ email, is_active: true })
    
    if (excludeId) {
      query = query.whereNot('id', excludeId)
    }
    
    const user = await query.first()
    return !!user
  }

  async getUsersList(filters = {}) {
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
}

module.exports = new AuthRepository()
