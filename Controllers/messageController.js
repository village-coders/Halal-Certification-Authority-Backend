const Message = require('../Models/message');
const { supabase } = require('../Config/supabase'); // Your Supabase config

// Get all messages for current user (both sent and received)
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId },
        { receiver: 'admin' } // Users can see messages sent to admin
      ]
    })
    .populate('sender', 'fullName email profileImage')
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      message: 'Messages fetched successfully',
      messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, receiver = 'admin' } = req.body;
    const files = req.files || [];
    
    // Validate message content
    if (!content?.trim() && files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content or attachment is required'
      });
    }
    
    // Upload files to Supabase if any
    const attachments = [];
    for (const file of files) {
      const fileName = `messages/${Date.now()}_${file.originalname}`;
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('message-attachments') // Your Supabase bucket name
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
      
      if (error) {
        console.error('Supabase upload error:', error);
        continue; // Skip this file but continue with others
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);
      
      attachments.push({
        filename: file.originalname,
        url: urlData.publicUrl,
        fileType: file.mimetype,
        size: file.size
      });
    }
    
    // Create message
    const message = new Message({
      sender: userId,
      receiver,
      content: content?.trim() || '',
      attachments
    });
    
    await message.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName email profileImage');
    
    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: populatedMessage
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message'
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    
    // Find message where user is the receiver
    const message = await Message.findOne({
      _id: messageId,
      receiver: userId
    });
    
    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found or access denied'
      });
    }
    
    // Mark as read if not already read
    if (!message.read) {
      message.read = true;
      message.readAt = new Date();
      await message.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Message marked as read'
    });
    
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark message as read'
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Unread count fetched',
      count
    });
    
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch unread count'
    });
  }
};

// Get conversation with admin
exports.getAdminConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: 'admin' },
        { receiver: userId }
      ]
    })
    .populate('sender', 'fullName email profileImage')
    .sort({ createdAt: 1 }); // Oldest to newest for conversation view
    
    res.status(200).json({
      status: 'success',
      message: 'Conversation fetched successfully',
      messages
    });
    
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation'
    });
  }
};

// Admin: Get all user messages
exports.getAllMessages = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }
    
    const { page = 1, limit = 20, userId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    let query = {};
    if (userId) {
      query.$or = [
        { sender: userId , receiver: "admin"},
        { receiver: userId, sender: req.user.id }
      ];
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'fullName email companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Message.countDocuments(query);
    
    res.status(200).json({
      status: 'success',
      message: 'Messages fetched successfully',
      data: {
        messages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching all messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
};

// Admin: Send message to user
exports.sendAdminMessage = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }
    
    const { content, receiver } = req.body;
    const files = req.files || [];
    
    if (!receiver) {
      return res.status(400).json({
        status: 'error',
        message: 'Receiver is required'
      });
    }
    
    if (!content?.trim() && files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content or attachment is required'
      });
    }
    
    // Upload files to Supabase if any
    const attachments = [];
    for (const file of files) {
      const fileName = `messages/${Date.now()}_${file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });
      
      if (error) {
        console.error('Supabase upload error:', error);
        continue;
      }
      
      const { data: urlData } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);
      
      attachments.push({
        filename: file.originalname,
        url: urlData.publicUrl,
        fileType: file.mimetype,
        size: file.size
      });
    }
    
    // Create message from admin
    const message = new Message({
      sender: req.user.id, // Special identifier for admin
      receiver,
      content: content?.trim() || '',
      attachments
    });
    
    await message.save();
    
    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message'
    });
  }
};


// Admin: Get all user conversations
exports.getAllUserConversations = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    const { search, status, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build aggregation pipeline
    const pipeline = [
      // Group messages by user
      {
        $group: {
          _id: '$sender',
          lastMessage: { $last: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$read', false] }, { $ne: ['$sender', 'admin'] }] },
                1,
                0
              ]
            }
          },
          messageCount: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      // Lookup user information
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      // Filter by search
      ...(search ? [{
        $match: {
          $or: [
            { 'user.fullName': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'user.companyName': { $regex: search, $options: 'i' } }
          ]
        }
      }] : []),
      // Filter by status
      ...(status === 'unread' ? [{
        $match: { unreadCount: { $gt: 0 } }
      }] : []),
      // Sort by last activity
      { $sort: { lastActivity: -1 } },
      // Pagination
      { $skip: skip },
      { $limit: limitNum }
    ];

    const conversations = await Message.aggregate(pipeline);

    // Get total count
    const countPipeline = [...pipeline.slice(0, -2), { $count: 'total' }];
    const countResult = await Message.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.status(200).json({
      status: 'success',
      message: 'Conversations fetched successfully',
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversations'
    });
  }
};

// Admin: Get conversation with specific user
exports.getUserConversation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    const adminId = req.user.id

    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId,  receiver: "admin"},
        {  receiver: userId, sender: adminId},
        { sender: userId, receiver: adminId  } // In case user messaged admin directly
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'fullName email profileImage companyName')
    .lean();

    // Format messages
    const formattedMessages = messages.map(message => ({
      ...message,
      senderType: message.sender === 'admin' ? 'admin' : 'user'
    }));

    res.status(200).json({
      status: 'success',
      message: 'Conversation fetched successfully',
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error fetching user conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch conversation'
    });
  }
};

// Admin: Mark all messages as read for a user
exports.markUserConversationAsRead = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    const { userId } = req.params;

    await Message.updateMany(
      {
        sender: userId,
        // receiver: 'admin',
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark messages as read'
    });
  }
};

// Admin: Mark all conversations as read
exports.markAllAsRead = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    await Message.updateMany(
      {
        receiver: 'admin',
        read: false
      },
      {
        $set: { read: true, readAt: new Date() }
      }
    );

    res.status(200).json({
      status: 'success',
      message: 'All messages marked as read'
    });

  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark all as read'
    });
  }
};

// Admin: Archive conversation
exports.archiveConversation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    const { conversationId } = req.params;

    // Update all messages in conversation to archived status
    await Message.updateMany(
      { conversationId },
      { $set: { status: 'archived' } }
    );

    res.status(200).json({
      status: 'success',
      message: 'Conversation archived'
    });

  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to archive conversation'
    });
  }
};

// Admin: Delete conversation
exports.deleteConversation = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Admin only.'
      });
    }

    const { conversationId } = req.params;

    // Soft delete messages
    await Message.updateMany(
      { conversationId },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    res.status(200).json({
      status: 'success',
      message: 'Conversation deleted'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete conversation'
    });
  }
};



