const mongoose = require('mongoose');

const logsheetSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'application',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  companyEmail: {
    type: String,
    required: true
  },
  auditReport: {
    type: String, // File URL
    required: true
  },
  labResult: {
    type: String // File URL (optional or required depending on logic, making it optional by default here)
  },
  additionalDocuments: [{ type: String }], // Extra document URLs
  signatures: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    signerName: String,
    signerTitle: String,
    signedAt: {
      type: Date,
      default: Date.now
    },
    signatureImage: {
      type: String // Capture of the signature at time of signing
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  isFinalized: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const logsheetModel = mongoose.model('logsheet', logsheetSchema);
module.exports = logsheetModel;
