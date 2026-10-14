const mongoose = require('mongoose');

const creditClaimLogSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    creditsClaimed: {
      type: Number,
      default: 2,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CreditClaimLog = mongoose.model('CreditClaimLog', creditClaimLogSchema);

module.exports = CreditClaimLog;
