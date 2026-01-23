const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    companyId: {
        type: String,
        required: true
    },
    certificate: {
        type: String,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "registered"], // lowercase for consistency
      default: "requested",
    },
  },
  { timestamps: true } // adds createdAt & updatedAt automatically
);

const Product = mongoose.model('product', productSchema);
module.exports = Product;
