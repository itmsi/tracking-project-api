const { response } = require('../../utils')
const analyticsRepository = require('./postgre_repository')

class AnalyticsHandler {
  async getDashboardAnalytics(req, res, next) {
    try {
      const userId = req.user.id
      const { period } = req.query

      const analytics = await analyticsRepository.getDashboardAnalytics(userId, period)
      
      return response.success(res, 200, 'Analytics dashboard berhasil diambil', analytics)
    } catch (error) {
      next(error)
    }
  }

  async getProjectAnalytics(req, res, next) {
    try {
      const userId = req.user.id
      const { project_id, period } = req.query

      const analytics = await analyticsRepository.getProjectAnalytics(userId, project_id, period)
      
      return response.success(res, 200, 'Analytics proyek berhasil diambil', analytics)
    } catch (error) {
      next(error)
    }
  }

  async getTaskAnalytics(req, res, next) {
    try {
      const userId = req.user.id
      const { project_id, period } = req.query

      const analytics = await analyticsRepository.getTaskAnalytics(userId, project_id, period)
      
      return response.success(res, 200, 'Analytics task berhasil diambil', analytics)
    } catch (error) {
      next(error)
    }
  }

  async getTeamAnalytics(req, res, next) {
    try {
      const userId = req.user.id
      const { team_id, period } = req.query

      const analytics = await analyticsRepository.getTeamAnalytics(userId, team_id, period)
      
      return response.success(res, 200, 'Analytics team berhasil diambil', analytics)
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new AnalyticsHandler()
