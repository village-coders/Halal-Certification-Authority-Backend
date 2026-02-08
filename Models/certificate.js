const mongoose = require('mongoose');
const { ref } = require('pdfkit');

const certificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true
  },
  certificateType: {
    type: String,
    required: true,
    // enum: [
    //   'Food Safety Certification',
    //   'Quality Management System',
    //   'Environmental Management',
    //   'Occupational Health & Safety',
    //   'Halal Certification',
    //   'Organic Certification'
    // ]
  },
  standard: {
    type: String,
    required: true,
    enum: [
      'ISO 22000:2018',
      'ISO 9001:2015',
      'ISO 14001:2015',
      'ISO 45001:2018',
      'HACCP',
      'GLOBALG.A.P.',
      'BRCGS',
      'FSSC 22000'
    ]
  },
  status: {
    type: String,
    enum: ['Active', 'Expiring Soon', 'Expired', 'Suspended', 'Revoked', 'Pending'],
    default: 'Active'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'application',
    required: true
  },
  companyId: {
    type: String,
    required: true
  },
  pdfPath: {
    type: String,
    default: ''
  },
    // NEW: Store GridFS file ID instead of local path
  pdfFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'certificatePDFs.files' // Reference to GridFS collection
  },
  generatedBy: {
    type: String,
    default: 'System'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better query performance
certificateSchema.index({ certificateNumber: 1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ expiryDate: 1 });
certificateSchema.index({ companyId: 1 });
certificateSchema.index({ applicationId: 1 });

// Pre-save middleware to update status based on expiry date
certificateSchema.pre('save', function(next) {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  if (this.expiryDate < now) {
    this.status = 'Expired';
  } else if (this.expiryDate <= thirtyDaysFromNow) {
    this.status = 'Expiring Soon';
  } else if (this.status === 'Expired' || this.status === 'Expiring Soon') {
    this.status = 'Active';
  }
  
  next();
});

const certificateModel = mongoose.model('certificate', certificateSchema);
module.exports = certificateModel;