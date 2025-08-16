const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const Payment = require('../models/Payment');
const Match = require('../models/Match');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  generateMatchPaymentLink,
  verifyWebhookSignature,
  verifyPaymentSignature,
  fetchPayment,
  createRefund,
  handleWebhookEvent
} = require('../config/razorpay');

/**
 * @route   GET /api/payments
 * @desc    Get available payment endpoints
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PlaySplit Payments API',
    version: '1.0.0',
    endpoints: {
      'POST /create-payment-link': {
        description: 'Create payment link for a match',
        access: 'Private (User)',
        body: { matchId: 'string' }
      },
      'POST /verify': {
        description: 'Verify payment signature',
        access: 'Private (User)',
        body: {
          razorpay_order_id: 'string',
          razorpay_payment_id: 'string',
          razorpay_signature: 'string'
        }
      },
      'POST /webhook': {
        description: 'Razorpay webhook endpoint',
        access: 'Public (Verified)',
        note: 'Used by Razorpay to send payment notifications'
      },
      'GET /webhook/test': {
        description: 'Test webhook endpoint accessibility',
        access: 'Public'
      },
      'POST /mark-cash-payment': {
        description: 'Mark cash payment as paid',
        access: 'Private (Admin)',
        body: { matchId: 'string', userId: 'string', amount: 'number' }
      },
      'GET /match/:matchId': {
        description: 'Get all payments for a match',
        access: 'Private (Organizer/Admin)'
      },
      'GET /user': {
        description: 'Get user payment history',
        access: 'Private (User)'
      },
      'POST /refund': {
        description: 'Initiate refund for a payment',
        access: 'Private (Admin)',
        body: { paymentId: 'string', amount: 'number (optional)', reason: 'string' }
      }
    },
    documentation: 'See individual endpoints for detailed usage'
  });
});

/**
 * @route   POST /api/payments/create-payment-link
 * @desc    Create payment link for a match
 * @access  Private
 */
router.post('/create-payment-link', [
  authenticateToken,
  body('matchId').notEmpty().withMessage('Match ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { matchId } = req.body;
  const user = req.user;

  // Find the match
  const match = await Match.findOne({ matchId });
  if (!match) {
    return res.status(404).json({
      success: false,
      message: 'Match not found'
    });
  }

  // Check if user is part of the match
  const playerInfo = match.players.find(p => p.user.toString() === user._id.toString());
  if (!playerInfo) {
    return res.status(400).json({
      success: false,
      message: 'You are not part of this match'
    });
  }

  if (playerInfo.paymentStatus === 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Payment already completed'
    });
  }

  // Check if payment record exists
  let payment = await Payment.findOne({
    match: match._id,
    user: user._id
  });

  if (!payment) {
    // Create new payment record
    payment = new Payment({
      paymentId: `pay_${uuidv4()}`,
      match: match._id,
      user: user._id,
      amount: playerInfo.amountToPay,
      method: 'upi',
      status: 'created',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await payment.save();
  }

  try {
    // Generate Razorpay payment link
    const paymentLink = await generateMatchPaymentLink(
      matchId,
      user._id,
      playerInfo.amountToPay,
      {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    );

    // Update payment with link details
    payment.metadata.paymentLink = paymentLink.short_url;
    await payment.save();

    res.json({
      success: true,
      message: 'Payment link generated successfully',
      data: {
        paymentLink: paymentLink.short_url,
        amount: playerInfo.amountToPay,
        expiresAt: new Date(paymentLink.expire_by * 1000)
      }
    });

  } catch (error) {
    console.error('Payment link creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment link',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment signature
 * @access  Private
 */
router.post('/verify', [
  authenticateToken,
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay
    const razorpayPayment = await fetchPayment(razorpay_payment_id);
    
    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    }).populate('match');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment status
    await payment.markAsPaid({
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      gatewayResponse: razorpayPayment
    });

    // Update match player payment status
    const match = await Match.findById(payment.match._id);
    match.updatePaymentStatus(payment.user, 'paid', {
      amount: payment.amount,
      method: razorpayPayment.method,
      paymentId: razorpay_payment_id
    });
    await match.save();

    // Real-time update
    const io = req.app.get('io');
    io.to(`match-${match.matchId}`).emit('paymentCompleted', {
      matchId: match.matchId,
      userId: payment.user,
      amount: payment.amount
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        paymentId: payment.paymentId,
        status: payment.status,
        amount: payment.amount
      }
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public (but verified)
 */
router.post('/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body;

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: 'Missing signature'
    });
  }

  // Verify webhook signature
  const isValid = verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid webhook signature'
    });
  }

  try {
    const event = JSON.parse(rawBody.toString());
    console.log('🔔 Razorpay Webhook received:', {
      event: event.event,
      timestamp: new Date().toISOString(),
      account_id: event.account_id
    });

    const eventData = handleWebhookEvent(event);
    
    if (eventData) {
      switch (eventData.event) {
        case 'payment.captured':
          await handlePaymentCapturedWebhook(eventData, event, req);
          break;
        case 'payment.failed':
          await handlePaymentFailedWebhook(eventData, event, req);
          break;
        case 'order.paid':
          await handleOrderPaidWebhook(eventData, event, req);
          break;
        case 'refund.created':
        case 'refund.processed':
          await handleRefundWebhook(eventData, event, req);
          break;
        default:
          console.log('📝 Unhandled webhook event:', eventData.event);
      }
    }

    console.log('✅ Webhook processed successfully:', event.event);
    res.status(200).json({ 
      received: true, 
      event: event.event,
      processed: !!eventData 
    });

  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
}));

/**
 * @route   POST /api/payments/mark-cash-payment
 * @desc    Mark cash payment as paid (Admin only)
 * @access  Private (Admin)
 */
router.post('/mark-cash-payment', [
  authenticateToken,
  requireAdmin,
  body('matchId').notEmpty().withMessage('Match ID is required'),
  body('userId').notEmpty().withMessage('User ID is required'),
  body('amount').isNumeric().withMessage('Amount is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { matchId, userId, amount, notes } = req.body;

  // Find match
  const match = await Match.findOne({ matchId });
  if (!match) {
    return res.status(404).json({
      success: false,
      message: 'Match not found'
    });
  }

  // Create or update payment record
  let payment = await Payment.findOne({
    match: match._id,
    user: userId
  });

  if (!payment) {
    payment = new Payment({
      paymentId: `cash_${uuidv4()}`,
      match: match._id,
      user: userId,
      amount: amount,
      method: 'cash',
      status: 'paid',
      metadata: {
        markedBy: req.user._id,
        notes: notes || 'Manually marked as cash payment'
      }
    });
  } else {
    payment.status = 'paid';
    payment.method = 'cash';
    payment.metadata.markedBy = req.user._id;
    payment.metadata.notes = notes || 'Manually marked as cash payment';
  }

  await payment.save();

  // Update match player payment status
  match.updatePaymentStatus(userId, 'paid', {
    amount: amount,
    method: 'cash',
    paymentId: payment.paymentId
  });
  await match.save();

  // Real-time update
  const io = req.app.get('io');
  io.to(`match-${match.matchId}`).emit('paymentCompleted', {
    matchId: match.matchId,
    userId: userId,
    amount: amount,
    method: 'cash'
  });

  res.json({
    success: true,
    message: 'Cash payment marked successfully',
    data: {
      paymentId: payment.paymentId,
      amount: payment.amount,
      method: payment.method
    }
  });
}));

/**
 * @route   GET /api/payments/match/:matchId
 * @desc    Get all payments for a match
 * @access  Private (Match organizer/Admin)
 */
router.get('/match/:matchId', [
  authenticateToken,
  param('matchId').notEmpty().withMessage('Match ID is required')
], asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findOne({ matchId });
  if (!match) {
    return res.status(404).json({
      success: false,
      message: 'Match not found'
    });
  }

  // Check if user is organizer or admin
  const isOrganizer = match.organizer.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOrganizer && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const payments = await Payment.getPaymentsByMatch(match._id);

  res.json({
    success: true,
    data: { payments }
  });
}));

/**
 * @route   GET /api/payments/user
 * @desc    Get user's payment history
 * @access  Private
 */
router.get('/user', authenticateToken, asyncHandler(async (req, res) => {
  const payments = await Payment.getPaymentsByUser(req.user._id);

  res.json({
    success: true,
    data: { payments }
  });
}));

/**
 * @route   POST /api/payments/refund
 * @desc    Initiate refund for a payment
 * @access  Private (Admin only)
 */
router.post('/refund', [
  authenticateToken,
  requireAdmin,
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('amount').optional().isNumeric().withMessage('Valid refund amount required'),
  body('reason').notEmpty().withMessage('Refund reason is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { paymentId, amount, reason } = req.body;

  const payment = await Payment.findOne({ paymentId }).populate('user match');
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.status !== 'paid') {
    return res.status(400).json({
      success: false,
      message: 'Can only refund completed payments'
    });
  }

  if (payment.method === 'cash') {
    return res.status(400).json({
      success: false,
      message: 'Cannot process online refund for cash payments'
    });
  }

  try {
    const refundAmount = amount || payment.amount;
    
    // Create refund in Razorpay
    const refund = await createRefund(payment.razorpayPaymentId, refundAmount, {
      reason: reason
    });

    // Update payment record
    await payment.initiateRefund(refundAmount, reason, req.user._id);

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Refund initiation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

/**
 * @route   GET /api/payments/webhook/test
 * @desc    Test webhook endpoint configuration
 * @access  Public (for testing only)
 */
router.get('/webhook/test', (req, res) => {
  console.log('🧪 Webhook test endpoint called');
  
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    endpoint: `${req.protocol}://${req.get('host')}/api/payments/webhook`,
    headers: {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type')
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasWebhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET,
      hasRazorpayKeys: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    }
  });
});

// Webhook handler functions
async function handlePaymentCapturedWebhook(eventData, event, req) {
  console.log('💰 Processing payment.captured webhook:', eventData.paymentId);
  
  // Find and update payment
  const payment = await Payment.findOne({
    razorpayPaymentId: eventData.paymentId
  }).populate('match user');

  if (payment) {
    await payment.markAsPaid({
      razorpayPaymentId: eventData.paymentId,
      gatewayResponse: event.payload.payment.entity
    });

    // Update match
    const match = await Match.findById(payment.match._id);
    match.updatePaymentStatus(payment.user._id, 'paid', {
      amount: eventData.amount,
      method: event.payload.payment.entity.method,
      paymentId: eventData.paymentId
    });
    await match.save();

    // Real-time notification
    const io = req.app.get('io');
    io.to(`match-${match.matchId}`).emit('paymentCompleted', {
      matchId: match.matchId,
      userId: payment.user._id,
      amount: eventData.amount
    });

    console.log('✅ Payment captured and updated:', {
      paymentId: eventData.paymentId,
      matchId: match.matchId,
      amount: eventData.amount
    });
  } else {
    console.warn('⚠️ Payment record not found for:', eventData.paymentId);
  }
}

async function handlePaymentFailedWebhook(eventData, event, req) {
  console.log('❌ Processing payment.failed webhook:', eventData.paymentId);
  
  const payment = await Payment.findOne({
    razorpayPaymentId: eventData.paymentId
  }).populate('match');

  if (payment) {
    payment.status = 'failed';
    payment.metadata.failureReason = eventData.errorDescription;
    payment.metadata.errorCode = eventData.errorCode;
    await payment.save();

    // Real-time notification
    const io = req.app.get('io');
    io.to(`match-${payment.match.matchId}`).emit('paymentFailed', {
      matchId: payment.match.matchId,
      userId: payment.user,
      paymentId: eventData.paymentId,
      error: eventData.errorDescription
    });

    console.log('💸 Payment failure recorded:', {
      paymentId: eventData.paymentId,
      error: eventData.errorDescription
    });
  }
}

async function handleOrderPaidWebhook(eventData, event, req) {
  console.log('🏦 Processing order.paid webhook:', eventData.orderId);
  // Additional logic for order.paid events if needed
}

async function handleRefundWebhook(eventData, event, req) {
  console.log('↩️ Processing refund webhook:', eventData.refundId);
  
  const payment = await Payment.findOne({
    razorpayPaymentId: eventData.paymentId
  }).populate('match user');

  if (payment) {
    payment.status = eventData.event === 'refund.processed' ? 'refunded' : 'refund_pending';
    payment.metadata.refundId = eventData.refundId;
    payment.metadata.refundAmount = eventData.amount;
    payment.metadata.refundStatus = eventData.status;
    await payment.save();

    // Real-time notification
    const io = req.app.get('io');
    io.to(`match-${payment.match.matchId}`).emit('refundUpdated', {
      matchId: payment.match.matchId,
      userId: payment.user._id,
      refundId: eventData.refundId,
      amount: eventData.amount,
      status: eventData.status
    });

    console.log('💸 Refund processed:', {
      refundId: eventData.refundId,
      paymentId: eventData.paymentId,
      amount: eventData.amount,
      status: eventData.status
    });
  }
}

module.exports = router;
