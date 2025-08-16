const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Verify Razorpay webhook signature
const verifyWebhookSignature = (rawBody, signature, secret) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
};

// Verify Razorpay payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Payment signature verification failed:', error);
    return false;
  }
};

// Create Razorpay order
const createOrder = async (amount, currency = 'INR', receipt, notes = {}) => {
  try {
    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt,
      notes,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw new Error('Failed to create payment order');
  }
};

// Fetch order details
const fetchOrder = async (orderId) => {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    console.error('Razorpay order fetch failed:', error);
    throw new Error('Failed to fetch order details');
  }
};

// Fetch payment details
const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay payment fetch failed:', error);
    throw new Error('Failed to fetch payment details');
  }
};

// Create refund
const createRefund = async (paymentId, amount, notes = {}) => {
  try {
    const refundData = {
      amount: amount * 100, // Amount in paise
      notes
    };

    const refund = await razorpay.payments.refund(paymentId, refundData);
    return refund;
  } catch (error) {
    console.error('Razorpay refund creation failed:', error);
    throw new Error('Failed to create refund');
  }
};

// Fetch refund details
const fetchRefund = async (paymentId, refundId) => {
  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return refund;
  } catch (error) {
    console.error('Razorpay refund fetch failed:', error);
    throw new Error('Failed to fetch refund details');
  }
};

// Create payment link
const createPaymentLink = async (options) => {
  try {
    const {
      amount,
      currency = 'INR',
      description,
      customer,
      notify = { sms: true, email: true },
      reminder_enable = true,
      notes = {},
      callback_url,
      callback_method = 'get'
    } = options;

    const paymentLinkData = {
      amount: amount * 100, // Amount in paise
      currency,
      accept_partial: false,
      expire_by: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      reference_id: `pl_${Date.now()}`,
      description,
      customer,
      notify,
      reminder_enable,
      notes,
      callback_url,
      callback_method
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkData);
    return paymentLink;
  } catch (error) {
    console.error('Razorpay payment link creation failed:', error);
    throw new Error('Failed to create payment link');
  }
};

// Cancel payment link
const cancelPaymentLink = async (paymentLinkId) => {
  try {
    const cancelledLink = await razorpay.paymentLink.cancel(paymentLinkId);
    return cancelledLink;
  } catch (error) {
    console.error('Razorpay payment link cancellation failed:', error);
    throw new Error('Failed to cancel payment link');
  }
};

// Generate payment link for match
const generateMatchPaymentLink = async (matchId, userId, amount, userDetails) => {
  try {
    const description = `Payment for PlaySplit Match ${matchId}`;
    const receipt = `match_${matchId}_user_${userId}`;
    
    const customer = {
      name: userDetails.name,
      email: userDetails.email,
      contact: userDetails.phone || '+919999999999'
    };

    const notes = {
      match_id: matchId,
      user_id: userId,
      type: 'match_payment'
    };

    const callback_url = `${process.env.CLIENT_URL}/payment/callback`;

    const paymentLink = await createPaymentLink({
      amount,
      description,
      customer,
      notes,
      callback_url
    });

    return paymentLink;
  } catch (error) {
    console.error('Match payment link generation failed:', error);
    throw error;
  }
};

// Webhook event handlers
const handleWebhookEvent = (event) => {
  const eventHandlers = {
    'payment.captured': handlePaymentCaptured,
    'payment.failed': handlePaymentFailed,
    'order.paid': handleOrderPaid,
    'refund.created': handleRefundCreated,
    'refund.processed': handleRefundProcessed
  };

  const handler = eventHandlers[event.event];
  if (handler) {
    return handler(event.payload);
  } else {
    console.warn(`Unhandled webhook event: ${event.event}`);
    return null;
  }
};

const handlePaymentCaptured = (payload) => {
  console.log('Payment captured:', payload.payment.entity.id);
  return {
    event: 'payment.captured',
    paymentId: payload.payment.entity.id,
    orderId: payload.payment.entity.order_id,
    amount: payload.payment.entity.amount / 100,
    status: payload.payment.entity.status
  };
};

const handlePaymentFailed = (payload) => {
  console.log('Payment failed:', payload.payment.entity.id);
  return {
    event: 'payment.failed',
    paymentId: payload.payment.entity.id,
    orderId: payload.payment.entity.order_id,
    amount: payload.payment.entity.amount / 100,
    status: payload.payment.entity.status,
    errorCode: payload.payment.entity.error_code,
    errorDescription: payload.payment.entity.error_description
  };
};

const handleOrderPaid = (payload) => {
  console.log('Order paid:', payload.order.entity.id);
  return {
    event: 'order.paid',
    orderId: payload.order.entity.id,
    amount: payload.order.entity.amount / 100,
    status: payload.order.entity.status
  };
};

const handleRefundCreated = (payload) => {
  console.log('Refund created:', payload.refund.entity.id);
  return {
    event: 'refund.created',
    refundId: payload.refund.entity.id,
    paymentId: payload.refund.entity.payment_id,
    amount: payload.refund.entity.amount / 100,
    status: payload.refund.entity.status
  };
};

const handleRefundProcessed = (payload) => {
  console.log('Refund processed:', payload.refund.entity.id);
  return {
    event: 'refund.processed',
    refundId: payload.refund.entity.id,
    paymentId: payload.refund.entity.payment_id,
    amount: payload.refund.entity.amount / 100,
    status: payload.refund.entity.status
  };
};

module.exports = {
  razorpay,
  verifyWebhookSignature,
  verifyPaymentSignature,
  createOrder,
  fetchOrder,
  fetchPayment,
  createRefund,
  fetchRefund,
  createPaymentLink,
  cancelPaymentLink,
  generateMatchPaymentLink,
  handleWebhookEvent
};
