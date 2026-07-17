const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['application', 'invoice', 'certificate', 'audit', 'product', 'message', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  forAdmin: {
    type: Boolean,
    default: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  showAsModal: {
    type: Boolean,
    default: false
  },
  // Deep-link action metadata for actionable client notifications
  actionType: {
    type: String,
    enum: [
      'view_invoice',           // Takes client to Invoices page
      'respond_audit_schedule', // Opens "Respond to Schedule" modal on Audits page
      'upload_nc_correction',   // Opens NC Correction upload modal on Audits page
      'view_audit',             // Highlights audit row on Audits page
      null
    ],
    default: null
  },
  actionData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const notificationModel = mongoose.model("notification", notificationSchema);

module.exports = notificationModel;

