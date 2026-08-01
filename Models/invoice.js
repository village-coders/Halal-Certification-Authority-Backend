const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'application',
        required: false
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
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'NGN'
    },
    status: {
        type: String,
        enum: ['Requested', 'Issued', 'Processing', 'Paid', 'Proof of Payment Approved', 'Cancelled', 'Invoice Sent', 'Payment Confirmed'],
        default: 'Issued'
    },
    rejectionReason: {
        type: String,
        default: null
    },
    rejectedAt: {
        type: Date,
        default: null
    },
    paymentId: {
        type: String
    },
    paymentType: {
        type: String,
        enum: ['Online', 'Offline'],
        default: 'Online'
    },
    proofOfPayment: {
        type: String
    },
    invoiceFile: {
        type: String
    },
    description: {
        type: String
    },
    issuedAt: {
        type: Date
    },
    paidAt: {
        type: Date
    }
}, { timestamps: true });

const invoiceModel = mongoose.model('invoice', invoiceSchema);
module.exports = invoiceModel;
