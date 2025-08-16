const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();

const Match = require('../models/Match');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth, requireMatchOrganizer } = require('../middleware/auth');

// Middleware to load match by ID and attach to request
const loadMatch = asyncHandler(async (req, res, next) => {
  const matchId = req.params.matchId;
  const match = await Match.findOne({ matchId })
    .populate('organizer', 'name email profilePicture')
    .populate('players.user', 'name email profilePicture');

  if (!match) {
    return res.status(404).json({
      success: false,
      message: 'Match not found'
    });
  }

  req.match = match;
  next();
});

/**
 * @route   POST /api/matches
 * @desc    Create a new match (regular or quick)
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  // Conditional validation based on isQuickMatch flag
  body('title').if(body('isQuickMatch').not().exists()).trim().notEmpty().withMessage('Title is required for regular matches'),
  body('venue.name').if(body('isQuickMatch').not().exists()).notEmpty().withMessage('Venue name is required for regular matches'),
  body('venue.address').if(body('isQuickMatch').not().exists()).notEmpty().withMessage('Venue address is required for regular matches'),
  body('dateTime').if(body('isQuickMatch').not().exists()).isISO8601().withMessage('Valid match date and time is required for regular matches'),
  body('duration').if(body('isQuickMatch').not().exists()).isInt({ min: 30 }).withMessage('Duration must be at least 30 minutes for regular matches'),
  body('maxPlayers').if(body('isQuickMatch').not().exists()).isInt({ min: 6, max: 22 }).withMessage('Max players must be between 6 and 22 for regular matches'),
  body('maxPlayers').if(body('isQuickMatch').exists()).optional().isInt({ min: 6, max: 1000 }).withMessage('Max players must be between 6 and 1000 for quick matches'),
  body('totalCost').if(body('isQuickMatch').not().exists()).isNumeric().withMessage('Total cost is required for regular matches'),
  body('turfType').if(body('isQuickMatch').not().exists()).isIn(['full', 'half', '7v7', '5v5']).withMessage('Invalid turf type'),
  body('costPerPlayer').optional().isNumeric(),
  body('status').optional().isIn(['draft', 'open']),
  body('isQuickMatch').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const matchData = { ...req.body, organizer: req.user._id };
  
  // Set default values for quick matches
  if (matchData.isQuickMatch) {
    matchData.status = 'started'; // Quick matches start immediately
    matchData.dateTime = matchData.dateTime || new Date(); // Use provided dateTime or current time
    matchData.title = matchData.title || `Quick Match`;
    
    // Only set venue if not provided
    if (!matchData.venue || (!matchData.venue.name && !matchData.venue.address)) {
      matchData.venue = {
        name: 'TBD',
        address: 'To be determined'
      };
    }
    
    // Use provided values or defaults
    matchData.duration = matchData.duration || 90;
    matchData.maxPlayers = matchData.maxPlayers || 100; // Use frontend value or default to 100
    matchData.turfType = matchData.turfType || 'full';
    matchData.totalCost = matchData.totalCost || 0;
    matchData.costPerPlayer = matchData.costPerPlayer || 0;
  }

  const newMatch = new Match(matchData);
  await newMatch.save();

  res.status(201).json({
    success: true,
    message: matchData.isQuickMatch ? 'Quick match created successfully' : 'Match created successfully',
    data: { match: newMatch }
  });
}));

/**
 * @route   GET /api/matches
 * @desc    Get all active matches
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const matches = await Match.find({
    status: { $in: ['open', 'started'] },
    dateTime: { $gte: new Date() }
  })
  .populate('organizer', 'name profilePicture')
  .sort({ dateTime: 1 });

  res.json({
    success: true,
    data: { matches }
  });
}));

/**
 * @route   GET /api/matches/:matchId
 * @desc    Get a single match by ID
 * @access  Public
 */
router.get('/:matchId', [ 
  param('matchId').notEmpty().withMessage('Match ID is required'),
  loadMatch
], asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { match: req.match }
  });
}));

/**
 * @route   PUT /api/matches/:matchId
 * @desc    Update a match
 * @access  Private (Organizer/Admin only)
 */
router.put('/:matchId', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch,
  requireMatchOrganizer
], asyncHandler(async (req, res) => {
  // Validation can be added here for updatable fields
  const updatedMatch = await Match.findByIdAndUpdate(
    req.match._id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Match updated successfully',
    data: { match: updatedMatch }
  });
}));

/**
 * @route   DELETE /api/matches/:matchId
 * @desc    Cancel a match
 * @access  Private (Organizer/Admin only)
 */
router.delete('/:matchId', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch,
  requireMatchOrganizer
], asyncHandler(async (req, res) => {
  req.match.status = 'cancelled';
  await req.match.save();

  // Notify players about cancellation (implementation needed)
  const io = req.app.get('io');
  io.to(`match-${req.match.matchId}`).emit('matchCancelled', { 
    matchId: req.match.matchId, 
    message: 'This match has been cancelled by the organizer.'
  });

  res.json({
    success: true,
    message: 'Match cancelled successfully'
  });
}));

/**
 * @route   POST /api/matches/:matchId/join
 * @desc    Join a match
 * @access  Private
 */
router.post('/:matchId/join', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch
], asyncHandler(async (req, res) => {
  const { match, user } = req;

  if (match.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'This match is not open for joining'
    });
  }

  try {
    match.addPlayer(user._id);
    await match.save();

    const io = req.app.get('io');
    io.to(`match-${match.matchId}`).emit('playerJoined', {
      matchId: match.matchId,
      player: { 
        _id: user._id,
        name: user.name,
        profilePicture: user.profilePicture
      }
    });

    res.json({
      success: true,
      message: 'Successfully joined the match',
      data: { match }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/matches/:matchId/leave
 * @desc    Leave a match
 * @access  Private
 */
router.post('/:matchId/leave', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch
], asyncHandler(async (req, res) => {
  const { match, user } = req;

  if (match.status === 'completed' || match.status === 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Cannot leave a completed or cancelled match'
    });
  }

  try {
    match.removePlayer(user._id);
    await match.save();

    const io = req.app.get('io');
    io.to(`match-${match.matchId}`).emit('playerLeft', {
      matchId: match.matchId,
      userId: user._id
    });

    res.json({
      success: true,
      message: 'Successfully left the match',
      data: { match }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}));

/**
 * @route   POST /api/matches/:matchId/start
 * @desc    Start a match (closes joining)
 * @access  Private (Organizer/Admin only)
 */
router.post('/:matchId/start', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch,
  requireMatchOrganizer
], asyncHandler(async (req, res) => {
  const { match } = req;

  if (match.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Match cannot be started'
    });
  }

  match.status = 'started';
  await match.save();

  const io = req.app.get('io');
  io.to(`match-${match.matchId}`).emit('matchStarted', {
    matchId: match.matchId,
    message: 'The match has started! Payments are now open.'
  });

  res.json({
    success: true,
    message: 'Match started successfully',
    data: { match }
  });
}));

/**
 * @route   POST /api/matches/:matchId/complete
 * @desc    Mark a match as completed
 * @access  Private (Organizer/Admin only)
 */
router.post('/:matchId/complete', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch,
  requireMatchOrganizer
], asyncHandler(async (req, res) => {
  const { match } = req;

  if (match.status !== 'started') {
    return res.status(400).json({
      success: false,
      message: 'Only a started match can be completed'
    });
  }

  // For quick matches, set status to pending-details for admin to fill details
  if (match.isQuickMatch) {
    match.status = 'pending-details';
    match.quickMatchData.actualEndTime = new Date();
    match.quickMatchData.actualDuration = Math.round((new Date() - match.dateTime) / 60000); // in minutes
  } else {
    match.status = 'completed';
  }
  
  await match.save();

  // Only update player stats for non-quick matches or quick matches with completed details
  if (!match.isQuickMatch) {
    const playerIds = match.players
      .filter(p => p.status === 'joined')
      .map(p => p.user);
    
    await User.updateMany(
      { _id: { $in: playerIds } },
      { $inc: { 'stats.matchesPlayed': 1 } }
    );
  }

  const io = req.app.get('io');
  const message = match.isQuickMatch 
    ? 'Match ended! Admin will now set the final details and costs.'
    : 'The match has ended. Thanks for playing!';
    
  io.to(`match-${match.matchId}`).emit('matchCompleted', {
    matchId: match.matchId,
    message
  });

  res.json({
    success: true,
    message: match.isQuickMatch ? 'Quick match ended. Please complete match details.' : 'Match completed successfully',
    data: { match }
  });
}));

/**
 * @route   POST /api/matches/:matchId/complete-details
 * @desc    Complete details for a quick match and trigger payments
 * @access  Private (Organizer/Admin only)
 */
router.post('/:matchId/complete-details', [
  authenticateToken,
  param('matchId').notEmpty(),
  loadMatch,
  requireMatchOrganizer,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('venue.name').notEmpty().withMessage('Venue name is required'),
  body('venue.address').notEmpty().withMessage('Venue address is required'),
  body('totalCost').isNumeric().withMessage('Total cost is required'),
  body('duration').optional().isInt({ min: 30 }).withMessage('Duration must be at least 30 minutes'),
  body('description').optional().trim(),
  body('actualPlayers').optional().isInt({ min: 1 }).withMessage('Actual players must be at least 1')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { match } = req;
  const { title, venue, totalCost, duration, description, actualPlayers } = req.body;

  if (!match.isQuickMatch || match.status !== 'pending-details') {
    return res.status(400).json({
      success: false,
      message: 'This operation is only allowed for quick matches pending details completion'
    });
  }

  // Update match details
  match.title = title;
  match.venue = venue;
  match.description = description || '';
  match.totalCost = totalCost;
  match.duration = duration || match.quickMatchData.actualDuration || 90;
  
  // Set actual player count
  const finalPlayerCount = actualPlayers || match.joinedPlayers.length;
  match.maxPlayers = finalPlayerCount;
  
  // Calculate cost per player
  match.costPerPlayer = Math.ceil(totalCost / finalPlayerCount);
  
  // Update all joined players' payment amounts
  match.players.forEach(player => {
    if (player.status === 'joined') {
      player.amountToPay = match.costPerPlayer;
      player.paymentStatus = 'pending'; // Reset payment status for collection
    }
  });
  
  // Mark as completed and details filled
  match.status = 'completed';
  match.detailsCompletedAt = new Date();
  
  await match.save();

  // Update player stats now that match is fully completed
  const playerIds = match.players
    .filter(p => p.status === 'joined')
    .map(p => p.user);
  
  await User.updateMany(
    { _id: { $in: playerIds } },
    { $inc: { 'stats.matchesPlayed': 1 } }
  );

  // Notify all players about payment requests
  const io = req.app.get('io');
  io.to(`match-${match.matchId}`).emit('paymentRequested', {
    matchId: match.matchId,
    costPerPlayer: match.costPerPlayer,
    message: `Match details completed! Payment of ₹${match.costPerPlayer} is now due.`
  });

  res.json({
    success: true,
    message: 'Match details completed successfully. Payment requests sent to all players.',
    data: { match }
  });
}));

module.exports = router;
