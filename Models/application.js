const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  product: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'Submitted'
  },
  requestedDate: {
    type: Date,
    required: true
  },
  // New fields for Halal certification history
  hasAppliedBefore: {
    type: String,
    required: true
  },
  previousHalalAgency: {
    type: String
  },
  hasBeenSupervisedBefore: {
    type: String,
    required: true
  },
  supervisingHalalAgency: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const applicationModel = mongoose.model('application', applicationSchema);
module.exports = applicationModel;