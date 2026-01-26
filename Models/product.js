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

    marketType: {
      type: String,
      enum: ["Food Service (Bulk)", "Retail", "Direct Marketing"],
      required: true
    },

    industry: {
      type: String,
      default: ""
    },

    brandOwnership: {
      type: String,
      enum: ["Owned", "Private Label"],
      required: true
    },

    // Compliance questions
    porkDerivative: {
      type: Boolean,
      required: true
    },

    animalDerivative: {
      type: Boolean,
      required: true
    },

    gelatin: {
      type: Boolean,
      required: true
    },

    alcohol: {
      type: Boolean,
      required: true
    },

    alcoholInAdditives: {
      type: Boolean,
      required: true
    },

    glycerine: {
      type: Boolean,
      required: true
    },

    // Markets
    markets: {
      type: [String],
      enum: [
        "Within Nigeria",
        "North Africa",
        "West Africa",
        "Europe",
        "Gulf Countries",
        "Asia",
        "United States",
        "Worldwide",
        "Other"
      ],
      default: []
    },

    // Approval flow
    status: {
      type: String,
      enum: ["requested", "approved", "registered"],
      default: "requested"
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Ownership / audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

const Product = mongoose.model('product', productSchema);
module.exports = Product;
