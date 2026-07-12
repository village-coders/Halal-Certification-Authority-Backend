const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  companyName: {
    type: String,
    // required: [true, "Company Name is required"]
  },
  fullName: {
    type: String,
    required: [true, "FullName is required"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: [true, "Email already exist"]
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  companyContact: {
    type: String,
    // required: true,
  },
  contact: {
    type: String,
    // required: true,
  },
  country: {
    type: String,
    // required: true,
  },
  agreeToTerms: {
    type: Boolean,
    // required: true,
  },
  authImage: {
    type: String,
    // required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationExp: {
    type: String,
  },
  verificationToken: {
    type: String,
  },
  role: {
    type: String,
    enum: ["company", "admin", "super admin"],
    default: "company",
    required: true
  },
  registrationNo: {
    type: String,
    // required: true
  },
  privileges: {
    type: [String],
    default: ["Viewer"]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBuilder: {
    type: Boolean,
    default: false
  },
  isUnderCompany: {
    type: Boolean,
    default: false
  },
  signatureImage: {
    type: String,
    default: ""
  },
  signatureName: {
    type: String,
    default: ""
  },
  signatureTitle: {
    type: String,
    default: ""
  },
  address: {
    type: String,
    // required: true
  },
  lga: {
    type: String,
    // required: true
  },
  city: {
    type: String,
    // required: true
  },
  state: {
    type: String,
    // required: true
  },
  position: {
    type: String,
    // required: true,
    default: "company"
  },
  website: {
    type: String,
    // required: true
  },
  approvedProducts: {
    type: Number,
    default: 0
  },
  hasApplication: {
    type: Boolean,
    default: false
  },
  department: {
    type: String,
    // required: true
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const userModel = mongoose.model("user", userSchema)

module.exports = userModel