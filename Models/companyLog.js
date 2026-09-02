const mongoose = require('mongoose');

const companyLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  companyName: { type: String, required: true },

  changes: [{
    field: { type: String, required: true },
    before: { type: String, default: '' },
    after: { type: String, default: '' }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const CompanyLog = mongoose.model('companyLog', companyLogSchema);

module.exports = CompanyLog;
