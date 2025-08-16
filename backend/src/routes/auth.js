const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const { verifyIdToken, setCustomUserClaims } = require('../config/firebase');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, userRateLimit } = require('../middleware/auth');

// Initialize Firebase Admin
const { initializeFirebase } = require('../config/firebase');
const firebaseAdmin = initializeFirebase();

// Middleware to check if Firebase is configured
const requireFirebase = (req, res, next) => {
  if (!firebaseAdmin) {
    return res.status(503).json({
      success: false,
      message: 'Firebase authentication not configured. Please set up Firebase credentials in your environment variables.',
      error: 'FIREBASE_NOT_CONFIGURED'
    });
  }
  next();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', [
  userRateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  body('idToken').notEmpty().withMessage('Firebase ID token is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('authProvider').isIn(['google', 'email']).withMessage('Valid auth provider is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { idToken, name, email, phone, authProvider } = req.body;

  try {
    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { firebaseUid },
        { email }
      ]
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    user = new User({
      firebaseUid,
      name,
      email,
      phone,
      authProvider,
      profilePicture: decodedToken.picture || null
    });

    await user.save();

    // Set custom claims in Firebase
    await setCustomUserClaims(firebaseUid, {
      role: user.role,
      playerId: user._id.toString()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.displayInfo,
        isNewUser: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
  userRateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  body('idToken').notEmpty().withMessage('Firebase ID token is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { idToken } = req.body;

  try {
    // Verify Firebase token
    const decodedToken = await verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Find user in database
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact support.'
      });
    }

    // Update user's last login and profile info if needed
    if (decodedToken.picture && decodedToken.picture !== user.profilePicture) {
      user.profilePicture = decodedToken.picture;
    }

    if (decodedToken.name && decodedToken.name !== user.name) {
      user.name = decodedToken.name;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.displayInfo,
        isNewUser: false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required'),
  body('preferences.notifications.email').optional().isBoolean(),
  body('preferences.notifications.push').optional().isBoolean(),
  body('preferences.preferredPaymentMethod').optional().isIn(['upi', 'cash', 'card'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const updates = req.body;
  const allowedUpdates = ['name', 'phone', 'preferences'];
  const updateObj = {};

  // Filter allowed updates
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateObj[key] = updates[key];
    }
  });

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateObj,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profile update failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh user session
 * @access  Private
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  // Just validate the token and return user info
  const user = await User.findById(req.user._id).select('-__v');
  
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Invalid session'
    });
  }

  res.json({
    success: true,
    message: 'Session refreshed',
    data: {
      user: user.displayInfo
    }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token cleanup)
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. Here we just confirm the logout.
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', [
  authenticateToken,
  body('confirmDelete').equals('DELETE').withMessage('Please confirm deletion by typing DELETE')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation required',
      errors: errors.array()
    });
  }

  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active matches
    const Match = require('../models/Match');
    const activeMatches = await Match.find({
      $or: [
        { organizer: req.user._id, status: { $in: ['open', 'started'] } },
        { 'players.user': req.user._id, 'players.status': 'joined' }
      ]
    });

    if (activeMatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active matches. Please complete or leave all matches first.'
      });
    }

    // Soft delete - mark as inactive instead of permanent deletion
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Account deletion failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
