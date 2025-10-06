const express = require('express')

const routing = express();
const API_TAG = '';

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
routing.use(`${API_TAG}/auth`, authModule)

// Projects Module
const projectsModule = require('../../modules/projects')
routing.use(`${API_TAG}/projects`, projectsModule)

// Tasks Module
const tasksModule = require('../../modules/tasks')
routing.use(`${API_TAG}/tasks`, tasksModule)

// Comments Module
const commentsModule = require('../../modules/comments')
routing.use(`${API_TAG}/comments`, commentsModule)

// Teams Module
const teamsModule = require('../../modules/teams')
routing.use(`${API_TAG}/teams`, teamsModule)

// Users Module
const usersModule = require('../../modules/users')
routing.use(`${API_TAG}/users`, usersModule)

module.exports = routing;
