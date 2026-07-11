const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'application',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'branch',
        required: false
    },
    staffName: {
        type: String,
        required: false
    },
    auditorEmail: {
        type: String
    },
    auditorPhone: {
        type: String
    },
    auditors: [{
        name: { type: String, required: true },
        email: { type: String },
        phone: { type: String },
        role: { type: String, enum: ['Lead Auditor', "Shari'a Auditor", 'Audit Trainee', 'Technical Auditor'], default: 'Audit Trainee' }
    }],
    scheduledDate: {
        type: Date,
        required: false
    },
    scheduledTime: {
        type: String,
        required: false
    },
    scheduledToDate: {
        type: Date,
        required: false
    },
    proposedDates: [{
        date: { type: Date },
        time: { type: String },      // kept for legacy
        fromTime: { type: String },   // start time on first day
        toDate: { type: Date },       // end date of audit period
        isCounter: { type: Boolean, default: false }
    }],
    status: {
        type: String,
        enum: ['Proposed', 'Counter Proposed', 'Date Concluded', 'Scheduled', 'Accepted', 'Rejected', 'Completed', 'NC Flagged', 'Audited'],
        default: 'Proposed'
    },
    rejectReason: {
        type: String
    },
    ncRejectReason: {
        type: String
    },
    ncRejectFiles: {
        type: [String],
        default: []
    },
    corrections: [{
        issue: { type: String },
        status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
        resolvedAt: { type: Date }
    }],
    notes: {
        type: String
    },
    auditReport: {
        type: String
    },
    ncReport: {
        type: String
    },
    reportUploadedAt: {
        type: Date
    },
    ncCorrectionFile: {
        type: [String],
        default: []
    },
    ncCorrectionUploadedAt: {
        type: Date
    },
    ncReminderSentAt: {
        type: Date
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

const auditModel = mongoose.model('audit', auditSchema);
module.exports = auditModel;
