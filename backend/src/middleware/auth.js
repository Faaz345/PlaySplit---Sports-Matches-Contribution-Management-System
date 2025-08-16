const { verifyIdToken } = require('../config/firebase');
const User = require('../models/User');

// Authenticate Firebase token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify the Firebase token
    const decodedToken = await verifyIdToken(token);
    
    // Find user in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found in database'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is disabled'
      });
    }

    // Attach user info to request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    let message = 'Authentication failed';
    let status = 401;
    
    if (error.code === 'auth/id-token-expired') {
      message = 'Token expired';
    } else if (error.code === 'auth/argument-error') {
      message = 'Invalid token format';
    } else if (error.message.includes('Invalid Firebase token')) {
      message = 'Invalid token';
    }
    
    return res.status(status).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

// Optional authentication (user can be null)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      req.user = null;
      req.firebaseUser = null;
      return next();
    }

    try {
      const decodedToken = await verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      
      req.user = user;
      req.firebaseUser = decodedToken;
    } catch (authError) {
      // If token is invalid, continue without user
      req.user = null;
      req.firebaseUser = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    req.firebaseUser = null;
    next();
  }
};

// Check if user is match organizer
const requireMatchOrganizer = (req, res, next) => {
  // This middleware should be used after a match is loaded into req.match
  if (!req.match) {
    return res.status(500).json({
      success: false,
      message: 'Match not loaded'
    });
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const isOrganizer = req.match.organizer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOrganizer && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only match organizer or admin can perform this action'
    });
  }

  next();
};

// Rate limiting based on user
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.firebaseUid || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, []);
    }
    
    const requests = requestCounts.get(userId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }
    
    validRequests.push(now);
    requestCounts.set(userId, validRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  requireMatchOrganizer,
  userRateLimit
};
