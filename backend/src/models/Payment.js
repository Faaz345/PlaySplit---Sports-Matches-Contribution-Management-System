const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    unique: true,
    sparse: true // allows null values for cash payments
  },
  razorpayOrderId: {
    type: String,
    sparse: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD']
  },
  method: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'cash', 'bank_transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'created'
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  failureReason: {
    type: String,
    default: null
  },
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    },
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceType: String,
    paymentLink: String,
    notes: String
  },
  timeline: [{
    status: String,
    timestamp: Date,
    notes: String
  }],
  verificationDetails: {
    signature: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for payment display info
paymentSchema.virtual('displayStatus').get(function() {
  const statusMap = {
    'created': 'Payment Created',
    'attempted': 'Payment Attempted',
    'paid': 'Payment Successful',
    'failed': 'Payment Failed',
    'cancelled': 'Payment Cancelled',
    'refunded': 'Payment Refunded'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

// Virtual for payment duration
paymentSchema.virtual('paymentDuration').get(function() {
  if (this.status === 'paid' && this.createdAt) {
    const duration = this.updatedAt - this.createdAt;
    return Math.round(duration / 1000); // in seconds
  }
  return null;
});

// Indexes for better query performance
paymentSchema.index({ paymentId: 1 }, { unique: true });
paymentSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ match: 1, user: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, status: 1 });

// Pre-save middleware to update timeline
paymentSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Methods
paymentSchema.methods.markAsPaid = function(paymentDetails = {}) {
  this.status = 'paid';
  this.gatewayResponse = paymentDetails.gatewayResponse || {};
  this.verificationDetails.verified = true;
  this.verificationDetails.verifiedAt = new Date();
  this.verificationDetails.signature = paymentDetails.signature;
  
  if (paymentDetails.razorpayPaymentId) {
    this.razorpayPaymentId = paymentDetails.razorpayPaymentId;
  }
  
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

paymentSchema.methods.initiateRefund = function(amount, reason, refundedBy) {
  this.refundDetails = {
    refundAmount: amount,
    refundStatus: 'pending',
    refundReason: reason,
    refundedBy: refundedBy,
    refundedAt: new Date()
  };
  return this.save();
};

paymentSchema.statics.getPaymentsByMatch = function(matchId) {
  return this.find({ match: matchId })
    .populate('user', 'name email profilePicture')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.getPaymentsByUser = function(userId) {
  return this.find({ user: userId })
    .populate('match', 'title dateTime venue.name costPerPlayer')
    .sort({ createdAt: -1 });
};

paymentSchema.statics.getRevenueStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        status: 'paid',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionAmount: { $avg: '$amount' }
      }
    }
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
