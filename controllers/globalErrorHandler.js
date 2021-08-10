const mongoose = require('mongoose')
const AppError = require('../utils/AppError')

const sendDevelopmentError = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    // stack: err.stack,
    err,
  })
}

const sendProductionError = (res, err) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  } else {
    console.error('---ERROR---', err)
    res.status(500).json({
      status: 'error',
      message: 'Sorry, something went wrong :(',
    })
  }
}

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleValidationError = error => {
  const message = Object.values(error.errors)
    .map(error => error.properties.message)
    .join(' ')
  return new AppError(message, 400)
}

const globalErrorHandler = (err, req, res, next) => {
  // let error = { ...err }

  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    if (err instanceof mongoose.Error.CastError) err.statusCode = 400
    sendDevelopmentError(res, err)
  }
  if (process.env.NODE_ENV === 'production') {
    if (err instanceof mongoose.Error.CastError) err = handleCastErrorDB(err)
    if (err instanceof mongoose.Error.ValidationError) err = handleValidationError(err)
    sendProductionError(res, err)
  }
}

module.exports = globalErrorHandler
