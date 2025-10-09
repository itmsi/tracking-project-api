const express = require('express')
const cors = require('cors')

require('dotenv').config()

const app = express()
const compress = require('compression')
const methodOverride = require('method-override')
const xss = require('xss-clean')
const morgan = require('morgan')
const {
  notFoundHandler,
  errorHandler,
  removeFavicon,
  MORGAN_FORMAT,
  syntaxError,
} = require('./utils')

const healthCheck = require('./routes')
const apiV1 = require('./routes/V1')
const { initListener } = require('./listeners')
const { prometheusMiddleware } = require('./middlewares/prometheus')

// Conditionally initialize listeners only if RabbitMQ is enabled
if (process.env.RABBITMQ_ENABLED === 'true' && process.env.RABBITMQ_URL && process.env.RABBITMQ_URL !== 'disabled') {
  console.log('Initializing RabbitMQ listeners...')
  initListener()
} else {
  console.log('RabbitMQ not enabled or configured, skipping listener initialization')
}

const limit = process.env.JSON_LIMIT || '1gb'
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development environment - allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Get allowed origins from environment variables
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
      ['http://localhost:3000', 'http://localhost:9554', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: process.env.CORS_METHODS ? 
    process.env.CORS_METHODS.split(',').map(method => method.trim()) : 
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: process.env.CORS_HEADERS ? 
    process.env.CORS_HEADERS.split(',').map(header => header.trim()) : 
    ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));
app.use(compress()) // gzip compression
app.use(methodOverride()) // lets you use HTTP verbs
app.use(xss()) // handler xss attack
app.use(express.json({ limit })) // json limit
app.use(express.urlencoded({ limit, extended: true })) // urlencoded limit
if (process.env.NODE_ENV === 'production') {
  app.use(morgan(MORGAN_FORMAT.PROD))
} else {
  app.use(morgan(MORGAN_FORMAT.DEV, { stream: process.stderr }))
}

// Prometheus monitoring middleware
app.use(prometheusMiddleware)

app.use(healthCheck) // routing
console.log('Registering /api routes...')
app.use('/api', apiV1) // routing
console.log('API routes registered successfully')
app.use('/public', express.static('public')) // for public folder
app.use(notFoundHandler) // 404 handler
app.use(errorHandler) // error handlerr
app.use(syntaxError) // error handlerr syntax
app.use(removeFavicon)

module.exports = app
