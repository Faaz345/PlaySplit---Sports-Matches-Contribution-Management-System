const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const playerParticipationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['joined', 'opted-out', 'removed'],
    default: 'joined'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'cash', 'card', 'wallet'],
    default: null
  },
  amountToPay: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentId: {
    type: String,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  leftEarly: {
    type: Boolean,
    default: false
  },
  leftAt: {
    type: Date,
    default: null
  }
});

const matchSchema = new mongoose.Schema({
  matchId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4().substr(0, 8).toUpperCase()
  },
  title: {
    type: String,
    required: function() {
      return !this.isQuickMatch; // Only required for non-quick matches
    },
    trim: true,
    default: function() {
      return this.isQuickMatch ? `Quick Match ${this.matchId}` : undefined;
    }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    name: {
      type: String,
      required: function() {
        return !this.isQuickMatch && this.status !== 'completed'; // Not required for quick matches until completion
      },
      trim: true,
      default: function() {
        return this.isQuickMatch ? 'TBD' : undefined;
      }
    },
    address: {
      type: String,
      required: function() {
        return !this.isQuickMatch && this.status !== 'completed';
      },
      trim: true,
      default: function() {
        return this.isQuickMatch ? 'To be determined' : undefined;
      }
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  dateTime: {
    type: Date,
    required: function() {
      return !this.isQuickMatch;
    },
    default: function() {
      return this.isQuickMatch ? new Date() : undefined; // Use current time for quick matches
    }
  },
  duration: {
    type: Number, // in minutes
    required: function() {
      return !this.isQuickMatch;
    },
    min: 30,
    max: 300,
    default: 90
  },
  turfType: {
    type: String,
    enum: ['full', 'half', '7v7', '5v5'],
    required: function() {
      return !this.isQuickMatch;
    },
    default: 'full'
  },
  maxPlayers: {
    type: Number,
    required: function() {
      return !this.isQuickMatch;
    },
    min: 6,
    validate: {
      validator: function(value) {
        if (this.isQuickMatch) {
          return value <= 1000; // Allow up to 1000 players for quick matches
        } else {
          return value <= 22; // Regular matches limited to 22 players
        }
      },
      message: function(props) {
        if (this.isQuickMatch) {
          return `Max players for quick matches cannot exceed 1000. You entered ${props.value}.`;
        } else {
          return `Max players for regular matches cannot exceed 22. You entered ${props.value}.`;
        }
      }
    },
    default: function() {
      return this.isQuickMatch ? 100 : 14; // Higher default for quick matches
    }
  },
  costPerPlayer: {
    type: Number,
    required: false, // Will be set after match completion for quick matches
    min: 0,
    default: 0
  },
  totalCost: {
    type: Number,
    required: false, // Will be calculated after match completion for quick matches
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'started', 'completed', 'cancelled', 'pending-details'],
    default: 'open'
  },
  // New fields for quick match functionality
  isQuickMatch: {
    type: Boolean,
    default: false
  },
  detailsCompletedAt: {
    type: Date,
    default: null
  },
  quickMatchData: {
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    actualDuration: { type: Number },
    actualLocation: { type: String },
    notes: { type: String }
  },
  players: [playerParticipationSchema],
  paymentSettings: {
    allowCashPayment: { type: Boolean, default: true },
    allowOnlinePayment: { type: Boolean, default: true },
    paymentDeadline: { type: Date, default: null },
    lateJoinAllowed: { type: Boolean, default: true },
    refundPolicy: {
      type: String,
      enum: ['no-refund', 'full-refund', 'partial-refund'],
      default: 'no-refund'
    }
  },
  gameSettings: {
    teamFormation: { type: String, default: '5v5' },
    matchType: {
      type: String,
      enum: ['casual', 'competitive', 'tournament'],
      default: 'casual'
    },
    rules: [String]
  },
  weather: {
    condition: { type: String, default: 'unknown' },
    temperature: { type: Number, default: null },
    lastUpdated: { type: Date, default: null }
  },
  notifications: {
    reminderSent: { type: Boolean, default: false },
    paymentReminderSent: { type: Boolean, default: false },
    startNotificationSent: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
matchSchema.virtual('joinedPlayers').get(function() {
  return this.players.filter(player => player.status === 'joined');
});

matchSchema.virtual('paidPlayers').get(function() {
  return this.players.filter(player => player.paymentStatus === 'paid');
});

matchSchema.virtual('availableSpots').get(function() {
  return this.maxPlayers - this.joinedPlayers.length;
});

matchSchema.virtual('totalCollected').get(function() {
  return this.players.reduce((sum, player) => {
    return player.paymentStatus === 'paid' ? sum + player.paidAmount : sum;
  }, 0);
});

matchSchema.virtual('shareLink').get(function() {
  return `${process.env.CLIENT_URL}/match/${this.matchId}`;
});

matchSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.dateTime;
});

matchSchema.virtual('isLive').get(function() {
  const now = new Date();
  const endTime = new Date(this.dateTime.getTime() + (this.duration * 60000));
  return now >= this.dateTime && now <= endTime;
});

// Indexes for better query performance
matchSchema.index({ matchId: 1 }, { unique: true });
matchSchema.index({ organizer: 1, status: 1 });
matchSchema.index({ dateTime: 1, status: 1 });
matchSchema.index({ 'players.user': 1 });

// Pre-save middleware
matchSchema.pre('save', function(next) {
  // Calculate cost per player based on total cost and max players
  if (this.isModified('totalCost') || this.isModified('maxPlayers')) {
    this.costPerPlayer = Math.ceil(this.totalCost / this.maxPlayers);
  }

  // Update player amounts when cost changes
  if (this.isModified('costPerPlayer')) {
    this.players.forEach(player => {
      if (player.paymentStatus === 'pending') {
        player.amountToPay = this.costPerPlayer;
      }
    });
  }

  next();
});

// Methods
matchSchema.methods.addPlayer = function(userId, amountToPay = null) {
  const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
  if (existingPlayer) {
    if (existingPlayer.status === 'opted-out') {
      existingPlayer.status = 'joined';
      existingPlayer.joinedAt = new Date();
      return existingPlayer;
    }
    throw new Error('Player already joined');
  }

  if (this.joinedPlayers.length >= this.maxPlayers) {
    throw new Error('Match is full');
  }

  const newPlayer = {
    user: userId,
    amountToPay: amountToPay || this.costPerPlayer,
    status: 'joined'
  };

  this.players.push(newPlayer);
  return newPlayer;
};

matchSchema.methods.removePlayer = function(userId) {
  const player = this.players.find(p => p.user.toString() === userId.toString());
  if (!player) {
    throw new Error('Player not found in match');
  }

  if (player.paymentStatus === 'paid') {
    // Mark as removed but keep payment record
    player.status = 'removed';
    player.leftEarly = true;
    player.leftAt = new Date();
  } else {
    // Remove completely if not paid
    this.players = this.players.filter(p => p.user.toString() !== userId.toString());
  }
  
  return player;
};

matchSchema.methods.updatePaymentStatus = function(userId, status, paymentDetails = {}) {
  const player = this.players.find(p => p.user.toString() === userId.toString());
  if (!player) {
    throw new Error('Player not found in match');
  }

  player.paymentStatus = status;
  
  if (status === 'paid') {
    player.paidAmount = paymentDetails.amount || player.amountToPay;
    player.paymentMethod = paymentDetails.method;
    player.paymentId = paymentDetails.paymentId;
    player.paidAt = new Date();
  }

  return player;
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
