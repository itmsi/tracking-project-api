const { validationResult } = require('express-validator')
const { mappingErrorValidation, baseResponse } = require('../utils')
const { lang } = require('../lang')

const checkMessageError = (catchMessage, errors) => {
  let message
  const extractedErrors = []
  errors.array().map((err) => extractedErrors.push(err.msg))
  switch ((catchMessage[0] && catchMessage[0][0]) || 'unknown') {
    case 'database':
      message = lang.__('knex.db')
      break
    case 'connect':
      message = lang.__('knex.connect')
      break
    case 'password':
      message = lang.__('knex.password')
      break
    case 'select':
      message = lang.__('knex.select')
      break
    case 'getaddrinfo':
      message = lang.__('knex.host')
      break
    case 'Please':
      message = errors.array()
      break
    default:
      message = extractedErrors
  }

  return message
}

const validateMiddleware = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const catchMessage = errors.array().map((err) => err.msg.split(' '))
    console.error('error validateMiddleware', errors);
    const message = checkMessageError(catchMessage, errors)
    return baseResponse(res, mappingErrorValidation(message))
  }

  return next()
}

// schema options
const options = {
  abortEarly: false, // include all errors
  allowUnknown: true, // ignore unknown props
  stripUnknown: true // remove unknown props
};

const joiResult = (schema, property = 'body') => (req, res, next) => {
  const { error } = schema.validate(req[property], options)
  if (error) {
    const extractedErrors = []
    console.error(error.details);
    error.details.map((err) => extractedErrors.push(err.message.replace(/"/g, '')))
    return baseResponse(res, mappingErrorValidation(extractedErrors))
  }
  // req[property] = value;
  return next()
}

// Validate request using Joi schema
const validateRequest = (validationSchema) => {
  return (req, res, next) => {
    const errors = []
    
    // Validate body
    if (validationSchema.body) {
      const { error } = validationSchema.body.validate(req.body, options)
      if (error) {
        error.details.forEach(detail => {
          errors.push(detail.message.replace(/"/g, ''))
        })
      }
    }
    
    // Validate params
    if (validationSchema.params) {
      const { error } = validationSchema.params.validate(req.params, options)
      if (error) {
        error.details.forEach(detail => {
          errors.push(detail.message.replace(/"/g, ''))
        })
      }
    }
    
    // Validate query
    if (validationSchema.query) {
      const { error } = validationSchema.query.validate(req.query, options)
      if (error) {
        error.details.forEach(detail => {
          errors.push(detail.message.replace(/"/g, ''))
        })
      }
    }
    
    if (errors.length > 0) {
      return baseResponse(res, mappingErrorValidation(errors))
    }
    
    return next()
  }
}

module.exports = {
  validateMiddleware,
  joiResult,
  validateRequest
}
