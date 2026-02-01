const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  receiver: {
    type: String, // 'admin' or user ID
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String, // Supabase URL
    fileType: String,
    size: Number
  }],
  isMine: {
    type: Boolean,
    default: false
  },
  isMine: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ read: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;