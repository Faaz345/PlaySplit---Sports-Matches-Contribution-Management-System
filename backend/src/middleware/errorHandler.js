const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = {
      name: 'ValidationError',
      message,
      statusCode: 400
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let field = Object.keys(err.keyValue)[0];
    let message = `${field} already exists`;
    
    // Custom messages for specific fields
    if (field === 'email') {
      message = 'An account with this email already exists';
    } else if (field === 'matchId') {
      message = 'Match ID already exists';
    } else if (field === 'firebaseUid') {
      message = 'User already registered';
    }
    
    error = {
      name: 'DuplicateError',
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      name: 'ValidationError',
      message,
      statusCode: 400
    };
  }

  // Firebase Authentication errors
  if (err.code && err.code.startsWith('auth/')) {
    let message = 'Authentication error';
    let statusCode = 401;
    
    switch (err.code) {
      case 'auth/id-token-expired':
        message = 'Token expired, please login again';
        break;
      case 'auth/invalid-id-token':
        message = 'Invalid token';
        break;
      case 'auth/user-not-found':
        message = 'User not found';
        statusCode = 404;
        break;
      case 'auth/user-disabled':
        message = 'User account has been disabled';
        statusCode = 403;
        break;
      default:
        message = 'Authentication failed';
    }
    
    error = {
      name: 'AuthenticationError',
      message,
      statusCode
    };
  }

  // Razorpay errors
  if (err.error && err.error.code) {
    let message = 'Payment processing error';
    let statusCode = 400;
    
    switch (err.error.code) {
      case 'BAD_REQUEST_ERROR':
        message = 'Invalid payment request';
        break;
      case 'GATEWAY_ERROR':
        message = 'Payment gateway error';
        statusCode = 503;
        break;
      case 'SERVER_ERROR':
        message = 'Payment server error';
        statusCode = 500;
        break;
      default:
        message = err.error.description || 'Payment error';
    }
    
    error = {
      name: 'PaymentError',
      message,
      statusCode
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      name: 'AuthenticationError',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      name: 'AuthenticationError',
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Custom application errors
  if (err.name === 'MatchFullError') {
    error = {
      name: 'BusinessLogicError',
      message: 'Match is full, cannot join',
      statusCode: 409
    };
  }

  if (err.name === 'PaymentRequiredError') {
    error = {
      name: 'PaymentError',
      message: 'Payment required to join match',
      statusCode: 402
    };
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      name: 'ValidationError',
      message: 'File too large',
      statusCode: 413
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      name: 'ValidationError',
      message: 'Unexpected file upload',
      statusCode: 400
    };
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED') {
    error = {
      name: 'ServiceError',
      message: 'Service temporarily unavailable',
      statusCode: 503
    };
  }

  if (err.code === 'ETIMEDOUT') {
    error = {
      name: 'ServiceError',
      message: 'Request timeout',
      statusCode: 408
    };
  }

  // Default error response
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Prepare error response
  const errorResponse = {
    success: false,
    message,
    error: {
      name: error.name || err.name || 'UnknownError',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  };

  // Add validation details for validation errors
  if (err.name === 'ValidationError' && err.errors) {
    errorResponse.validationErrors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message,
      value: err.errors[key].value
    }));
  }

  // Log error details for monitoring
  if (statusCode >= 500) {
    console.error(`🚨 Server Error ${statusCode}:`, {
      message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
};
