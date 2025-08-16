const express = require('express');
const { param, query, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const Match = require('../models/Match');
const Payment = require('../models/Payment');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /users
 * @desc    Get available user endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PlaySplit Users API',
    version: '1.0.0',
    endpoints: {
      'GET /matches': {
        description: 'Get user match history',
        access: 'Private (User)',
        query: { page: 'number', limit: 'number', status: 'string' }
      },
      'GET /payments': {
        description: 'Get user payment history',
        access: 'Private (User)',
        query: { page: 'number', limit: 'number', status: 'string' }
      },
      'GET /stats': {
        description: 'Get user statistics',
        access: 'Private (User)'
      },
      'GET /:userId/public': {
        description: 'Get public user profile',
        access: 'Public',
        params: { userId: 'MongoDB ObjectId' }
      },
      'GET /search': {
        description: 'Search users by name or email',
        access: 'Private (User)',
        query: { q: 'string (min 2 chars)', limit: 'number' }
      },
      'GET /notifications': {
        description: 'Get user notifications',
        access: 'Private (User)'
      }
    },
    documentation: 'All endpoints require authentication except /:userId/public'
  });
});

/**
 * @route   GET /api/users/matches
 * @desc    Get user's match history
 * @access  Private
 */
router.get('/matches', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['upcoming', 'completed', 'cancelled'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { status } = req.query;
  const userId = req.user._id;

  // Build filter
  const filter = {
    $or: [
      { organizer: userId },
      { 'players.user': userId, 'players.status': 'joined' }
    ]
  };

  const now = new Date();

  if (status === 'upcoming') {
    filter.dateTime = { $gte: now };
    filter.status = { $in: ['open', 'started'] };
  } else if (status === 'completed') {
    filter.status = 'completed';
  } else if (status === 'cancelled') {
    filter.status = 'cancelled';
  }

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('organizer', 'name profilePicture')
      .populate('players.user', 'name profilePicture')
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit),
    Match.countDocuments(filter)
  ]);

  // Add user-specific info to each match
  const matchesWithUserInfo = matches.map(match => {
    const matchObj = match.toObject();
    const isOrganizer = match.organizer._id.toString() === userId.toString();
    const playerInfo = match.players.find(p => p.user._id.toString() === userId.toString());

    matchObj.userRole = isOrganizer ? 'organizer' : 'player';
    matchObj.userPaymentStatus = playerInfo?.paymentStatus || null;
    matchObj.userAmountToPay = playerInfo?.amountToPay || null;

    return matchObj;
  });

  res.json({
    success: true,
    data: {
      matches: matchesWithUserInfo,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMatches: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * @route   GET /api/users/payments
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/payments', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('status').optional().isIn(['pending', 'paid', 'failed', 'refunded'])
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { status } = req.query;
  const userId = req.user._id;

  const filter = { user: userId };
  if (status) {
    filter.status = status;
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: 'match',
        select: 'title matchId dateTime venue.name status',
        populate: {
          path: 'organizer',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private
 */
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [
    matchesPlayed,
    matchesOrganized,
    totalPaid,
    upcomingMatches,
    recentPayments
  ] = await Promise.all([
    Match.countDocuments({
      'players.user': userId,
      'players.status': 'joined',
      status: 'completed'
    }),
    Match.countDocuments({
      organizer: userId,
      status: 'completed'
    }),
    Payment.aggregate([
      {
        $match: {
          user: userId,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    Match.countDocuments({
      $or: [
        { organizer: userId },
        { 'players.user': userId, 'players.status': 'joined' }
      ],
      dateTime: { $gte: new Date() },
      status: { $in: ['open', 'started'] }
    }),
    Payment.find({ user: userId })
      .populate('match', 'title matchId dateTime')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  // Get user's current profile and rating data
  const currentUser = await User.findById(userId).select('name email profilePicture stats preferences');
  
  const stats = {
    matches: {
      played: matchesPlayed || 0,
      organized: matchesOrganized || 0,
      upcoming: upcomingMatches || 0
    },
    payments: {
      totalPaid: totalPaid[0]?.total || 0,
      recent: recentPayments || []
    },
    avgRating: currentUser?.stats?.averageRating || 0,
    profile: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      profilePicture: currentUser?.profilePicture || null,
      preferences: currentUser?.preferences || {
        notifications: { email: true, push: true },
        preferredPaymentMethod: 'upi'
      }
    }
  };

  // Update user stats in database
  await User.findByIdAndUpdate(userId, {
    'stats.matchesPlayed': matchesPlayed,
    'stats.matchesOrganized': matchesOrganized,
    'stats.totalPaid': totalPaid[0]?.total || 0
  });

  res.json({
    success: true,
    data: { stats }
  });
}));

/**
 * @route   GET /api/users/:userId/public
 * @desc    Get public user profile
 * @access  Public
 */
router.get('/:userId/public', [
  param('userId').isMongoId().withMessage('Valid user ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { userId } = req.params;

  const user = await User.findById(userId)
    .select('name profilePicture stats createdAt')
    .where('isActive').equals(true);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get public match stats
  const [matchesOrganized, matchesPlayed] = await Promise.all([
    Match.countDocuments({
      organizer: userId,
      status: 'completed'
    }),
    Match.countDocuments({
      'players.user': userId,
      'players.status': 'joined',
      status: 'completed'
    })
  ]);

  const publicProfile = {
    ...user.toObject(),
    stats: {
      ...user.stats,
      matchesOrganized,
      matchesPlayed
    }
  };

  res.json({
    success: true,
    data: { user: publicProfile }
  });
}));

/**
 * @route   GET /api/users/search
 * @desc    Search users by name or email
 * @access  Private
 */
router.get('/search', [
  authenticateToken,
  query('q').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 20 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { q, limit = 10 } = req.query;

  const users = await User.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }
    ]
  })
  .select('name email profilePicture')
  .limit(parseInt(limit));

  res.json({
    success: true,
    data: { users }
  });
}));

/**
 * @route   GET /api/users/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // This is a simplified version - in a real app you'd have a notifications collection
  // For now, we'll return upcoming matches and payment reminders

  const upcomingMatches = await Match.find({
    $or: [
      { organizer: userId },
      { 'players.user': userId, 'players.status': 'joined' }
    ],
    dateTime: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
    },
    status: { $in: ['open', 'started'] }
  })
  .populate('organizer', 'name')
  .select('title matchId dateTime venue.name');

  const pendingPayments = await Match.find({
    'players.user': userId,
    'players.status': 'joined',
    'players.paymentStatus': 'pending',
    status: 'started'
  })
  .select('title matchId dateTime costPerPlayer');

  const notifications = [
    ...upcomingMatches.map(match => ({
      id: `match-${match.matchId}`,
      type: 'match_reminder',
      title: 'Upcoming Match',
      message: `${match.title} starts soon at ${match.venue.name}`,
      data: { matchId: match.matchId },
      createdAt: new Date()
    })),
    ...pendingPayments.map(match => ({
      id: `payment-${match.matchId}`,
      type: 'payment_reminder',
      title: 'Payment Pending',
      message: `Payment of ₹${match.costPerPlayer} is pending for ${match.title}`,
      data: { matchId: match.matchId },
      createdAt: new Date()
    }))
  ];

  res.json({
    success: true,
    data: { notifications }
  });
}));

module.exports = router;
