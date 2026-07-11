const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    branchName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    lga: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    contactName: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    positionTitle: {
        type: String,
        default: ''
    },
    webAddress: {
        type: String,
        default: ''
    },
    governmentPlantCode: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const branchModel = mongoose.model('branch', branchSchema);
module.exports = branchModel;