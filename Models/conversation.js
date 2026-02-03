// const mongoose = require('mongoose');

// const conversationSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   subject: {
//     type: String,
//     required: [true, 'Conversation subject is required'],
//     trim: true,
//     maxlength: [200, 'Subject cannot exceed 200 characters']
//   },
//   participants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   }],
//   lastMessage: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Message'
//   },
//   unreadCount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   status: {
//     type: String,
//     enum: ['active', 'archived', 'closed'],
//     default: 'active'
//   },
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high'],
//     default: 'medium'
//   },
//   tags: [{
//     type: String,
//     trim: true
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Update timestamp on save
// conversationSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Indexes for better query performance
// conversationSchema.index({ userId: 1, updatedAt: -1 });
// conversationSchema.index({ participants: 1, updatedAt: -1 });
// conversationSchema.index({ status: 1, updatedAt: -1 });

// const Conversation = mongoose.model('Conversation', conversationSchema);

// module.exports = Conversation;