const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    companyId: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: [
        "Fresh and Processed beef",
        "Fresh Poultry",
        "Seasoning",
        "Ambient stable Product",
        "Food Additives", 
        "Cosmetic Ingredients", 
        "Bakery and Confectionery product",
        "Dairy Product",
        "Non-alcoholic beverages & Soft drink",
        "Fruit Concentrates and Purees",
        "Catering  & Inflight Services",
        "Catering & Inflight Services",
        "Packaging",
        "Crude & Refined Oil",
        ""
      ],
      default: ""
    },

    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "application"
    },
    
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branch"
    },

    invoicePaid: {
      type: Boolean,
      default: false
    },

    document1: {
      fileUrl: String,
      publicId: String
    },

    document2: {
      fileUrl: String,
      publicId: String
    },

    document3: {
      fileUrl: String,
      publicId: String
    },


    // Approval flow
    status: {
      type: String,
      enum: ["requested", "acknowledged", "registered", "rejected"],
      default: "requested"
    },

    note: {
      type: String,
      default: ""
    },


    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },

    // Ownership / audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    }
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

const Product = mongoose.model('product', productSchema);
module.exports = Product;
