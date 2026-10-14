const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: ['candidate', 'support', 'content_manager', 'admin', 'super_admin'],
      default: 'candidate',
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'linkedin', 'github'],
      default: 'local',
    },
    providerId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    credits: {
      type: Number,
      default: 2, // Free trial default 2 credits upon registration
    },
    freeTrialClaimed: {
      type: Boolean,
      default: false,
    },
    freeTrialClaimedAt: {
      type: Date,
      default: null,
    },
    creditsExpiresAt: {
      type: Date,
      default: null, // Strict monthly validity expiration date
    },
    monthlyCreditAllowance: {
      type: Number,
      default: 2,
    },
    monthsRemainingInPlan: {
      type: Number,
      default: 0,
    },
    hasDirectAccess: {
      type: Boolean,
      default: false, // 1 Year Plan Direct Access / Annual Pool
    },
    plan: {
      type: String,
      enum: ['free', '1-month', '3-months', '1-year', 'basic', 'medium', 'advanced'],
      default: 'free',
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      default: null,
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', null],
      default: null,
    },
    creditsRenewAt: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High-concurrency query optimization indexes
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ plan: 1, lastActiveAt: -1 });
userSchema.index({ creditsExpiresAt: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update passwordChangedAt when password is changed
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare candidate password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
