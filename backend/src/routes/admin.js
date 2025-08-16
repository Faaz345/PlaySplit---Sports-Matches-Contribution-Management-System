const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const Match = require('../models/Match');
const Payment = require('../models/Payment');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { timeframe = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  // Get statistics
  const [
    totalUsers,
    totalMatches,
    activeMatches,
    completedMatches,
    totalRevenue,
    recentMatches,
    recentUsers,
    paymentStats
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Match.countDocuments(),
    Match.countDocuments({ 
      status: { $in: ['open', 'started'] },
      dateTime: { $gte: now }
    }),
    Match.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: startDate }
    }),
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    Match.find()
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .limit(5),
    User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5),
    Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ])
  ]);

  const dashboardStats = {
    users: {
      total: totalUsers,
      new: recentUsers.length
    },
    matches: {
      total: totalMatches,
      active: activeMatches,
      completed: completedMatches
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      period: timeframe
    },
    payments: paymentStats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        amount: stat.amount
      };
      return acc;
    }, {}),
    recent: {
      matches: recentMatches,
      users: recentUsers
    }
  };

  res.json({
    success: true,
    data: { dashboard: dashboardStats }
  });
}));

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Private (Admin only)
 */
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1 }),
  query('status').optional().isIn(['active', 'inactive'])
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
  const { search, status } = req.query;

  // Build filter
  const filter = {};
  
  if (status) {
    filter.isActive = status === 'active';
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    }
  });
}));

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Update user (role, status, etc.)
 * @access  Private (Admin only)
 */
router.put('/users/:userId', [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['player', 'admin']),
  body('isActive').optional().isBoolean()
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
  const updates = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
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
    message: 'User updated successfully',
    data: { user }
  });
}));

/**
 * @route   GET /api/admin/matches
 * @desc    Get all matches with filtering
 * @access  Private (Admin only)
 */
router.get('/matches', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'open', 'started', 'completed', 'cancelled']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
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
  const { status, dateFrom, dateTo } = req.query;

  // Build filter
  const filter = {};
  
  if (status) {
    filter.status = status;
  }

  if (dateFrom || dateTo) {
    filter.dateTime = {};
    if (dateFrom) filter.dateTime.$gte = new Date(dateFrom);
    if (dateTo) filter.dateTime.$lte = new Date(dateTo);
  }

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('organizer', 'name email')
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(limit),
    Match.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      matches,
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
 * @route   DELETE /api/admin/matches/:matchId
 * @desc    Force delete/cancel match
 * @access  Private (Admin only)
 */
router.delete('/matches/:matchId', [
  param('matchId').notEmpty().withMessage('Match ID is required')
], asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { action = 'cancel' } = req.body;

  const match = await Match.findOne({ matchId });
  if (!match) {
    return res.status(404).json({
      success: false,
      message: 'Match not found'
    });
  }

  if (action === 'cancel') {
    match.status = 'cancelled';
    await match.save();

    // Notify players
    const io = req.app.get('io');
    io.to(`match-${match.matchId}`).emit('matchCancelled', {
      matchId: match.matchId,
      message: 'This match has been cancelled by admin.',
      reason: 'Administrative action'
    });

    res.json({
      success: true,
      message: 'Match cancelled successfully'
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Only cancellation is supported.'
    });
  }
}));

/**
 * @route   GET /api/admin/payments
 * @desc    Get all payments with filtering
 * @access  Private (Admin only)
 */
router.get('/payments', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['created', 'paid', 'failed', 'refunded']),
  query('method').optional().isIn(['upi', 'card', 'cash', 'wallet']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
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
  const { status, method, dateFrom, dateTo } = req.query;

  // Build filter
  const filter = {};
  
  if (status) filter.status = status;
  if (method) filter.method = method;

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('user', 'name email')
      .populate('match', 'title matchId dateTime')
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
 * @route   GET /api/admin/analytics
 * @desc    Get detailed analytics
 * @access  Private (Admin only)
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    case '1y':
      startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      break;
    default:
      startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  }

  const [
    revenueByDay,
    matchesByStatus,
    paymentsByMethod,
    topOrganizers,
    userGrowth
  ] = await Promise.all([
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    Match.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]),
    Match.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$organizer',
          matchCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalCost' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'organizer'
        }
      },
      { $unwind: '$organizer' },
      { $sort: { matchCount: -1 } },
      { $limit: 10 }
    ]),
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      analytics: {
        revenue: revenueByDay,
        matches: matchesByStatus,
        payments: paymentsByMethod,
        topOrganizers,
        userGrowth
      },
      period
    }
  });
}));

module.exports = router;
