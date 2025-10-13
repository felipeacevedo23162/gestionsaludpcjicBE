const { validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Not found handler
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  };

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry - record already exists';
    error.statusCode = 409;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record does not exist';
    error.statusCode = 400;
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    error.message = 'Cannot delete - record is being referenced';
    error.statusCode = 409;
  } else if (err.code && err.code.startsWith('ER_')) {
    error.message = 'Database error occurred';
    error.statusCode = 500;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
    error.details = err.details;
  }

  // Set status code
  const statusCode = error.statusCode || err.statusCode || 500;

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      error.message = 'Internal server error';
    }
    delete error.stack;
  } else {
    error.stack = err.stack;
  }

  res.status(statusCode).json(error);
};

// Async handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  handleValidationErrors,
  notFound,
  errorHandler,
  asyncHandler
};