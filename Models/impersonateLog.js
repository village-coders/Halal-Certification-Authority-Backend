const mongoose = require('mongoose');

const impersonateLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },

  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },

  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: session duration in seconds (null if session is still active)
impersonateLogSchema.virtual('durationSeconds').get(function () {
  if (!this.endedAt) return null;
  return Math.floor((this.endedAt - this.startedAt) / 1000);
});

const ImpersonateLog = mongoose.model('impersonateLog', impersonateLogSchema);

module.exports = ImpersonateLog;
