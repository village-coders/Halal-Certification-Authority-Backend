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
    unique  : [true, "Email already exist"]
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
    enum: ["customer", "admin"],
    default: "customer",
    required: true
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