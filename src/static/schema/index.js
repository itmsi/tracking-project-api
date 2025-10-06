const adminMenu = require('./admin_menu.json')
const auth = require('./auth.json')
const authMember = require('./auth_member.json')
const companies = require('./companies.json')
const departments = require('./departments.json')
const employees = require('./employees.json')
const importModule = require('./import.json')
const response = require('./response.json')
const permissions = require('./permissions.json')
const systems = require('./systems.json')
const titles = require('./titles.json')
const ssoProfile = require('./sso_profile.json')

module.exports = {
  ...auth,
  ...adminMenu,
  ...authMember,
  ...companies,
  ...departments,
  ...employees,
  ...importModule,
  ...response,
  ...permissions,
  ...systems,
  ...titles,
  ...ssoProfile
}
