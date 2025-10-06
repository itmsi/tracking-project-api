const express = require('express')

const routing = express();

/* RULE
naming convention endpoint: using plural
Example:
- GET /api/projects
- POST /api/projects
- GET /api/projects/:id
- PUT /api/projects/:id
- DELETE /api/projects/:id
*/

// Auth Module
const authModule = require('../../modules/auth')
routing.use('/auth', authModule)

// Projects Module
const projectsModule = require('../../modules/projects')
routing.use('/projects', projectsModule)

// Tasks Module
const tasksModule = require('../../modules/tasks')
routing.use('/tasks', tasksModule)

// Comments Module
const commentsModule = require('../../modules/comments')
routing.use('/comments', commentsModule)

// Teams Module
const teamsModule = require('../../modules/teams')
routing.use('/teams', teamsModule)

// Users Module
const usersModule = require('../../modules/users')
routing.use('/users', usersModule)

module.exports = routing;
