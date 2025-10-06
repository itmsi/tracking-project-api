const info = {
  description: 'Express.js API Boilerplate - Template untuk pengembangan REST API dengan fitur lengkap',
  version: '1.0.0',
  title: 'Express.js API Boilerplate Documentation',
  contact: {
    email: 'your-email@example.com'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  }
}

const servers = [
  {
    url: '/api/',
    description: 'Development server'
  },
  {
    url: 'https://your-production-url.com/api/',
    description: 'Production server'
  }
]

// Import schemas
const authSchema = require('./schema/auth');
const authMemberSchema = require('./schema/auth_member');
const usersSchema = require('./schema/users');
const teamsSchema = require('./schema/teams');
const projectsSchema = require('./schema/projects');
const tasksSchema = require('./schema/tasks');
const commentsSchema = require('./schema/comments');
const responseSchema = require('./schema/response');

// Import paths
const authPaths = require('./path/auth');
const authMemberPaths = require('./path/auth_member');
const usersPaths = require('./path/users');
const teamsPaths = require('./path/teams');
const projectsPaths = require('./path/projects');
const tasksPaths = require('./path/tasks');

// Combine all schemas
const schemas = {
  ...authSchema,
  ...authMemberSchema,
  ...usersSchema,
  ...teamsSchema,
  ...projectsSchema,
  ...tasksSchema,
  ...commentsSchema,
  ...responseSchema,
};

// Combine all paths
const paths = {
  ...authPaths,
  ...authMemberPaths,
  ...usersPaths,
  ...teamsPaths,
  ...projectsPaths,
  ...tasksPaths,
};

const index = {
  openapi: '3.0.0',
  info,
  servers,
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas
  }
}

module.exports = {
  index
}
