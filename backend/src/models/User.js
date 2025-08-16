const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    sparse: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['player', 'admin'],
    default: 'player'
  },
  authProvider: {
    type: String,
    enum: ['google', 'email'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    preferredPaymentMethod: {
      type: String,
      enum: ['upi', 'cash', 'card'],
      default: 'upi'
    }
  },
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    matchesOrganized: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full display info
userSchema.virtual('displayInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    role: this.role
  };
});

// Index for better query performance
userSchema.index({ email: 1, firebaseUid: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Pre-save middleware to update stats
userSchema.pre('save', function(next) {
  if (this.isModified('stats.matchesPlayed') || this.isModified('stats.totalPaid')) {
    // Add any calculations here if needed
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
