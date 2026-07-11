const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderName: { type: String },
  content: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    size: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'Application', 'Certificate', 'Payment', 'Audit', 'Product', 'Other'],
      default: 'General'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open'
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    messages: [ticketMessageSchema],
    lastRepliedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    closedAt: Date
  },
  { timestamps: true }
);

// Auto-generate ticket number before saving
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `HDI-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

ticketSchema.index({ company: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
