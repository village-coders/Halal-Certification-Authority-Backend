const Ticket = require('../Models/ticket');
const notificationModel = require('../Models/notification');
const User = require('../Models/user');
const { getIo } = require('../Services/socketService');
const { uploadToHybridStorage, uploadToGridFS } = require('../Utils/fileUpload');
const { sendNewTicketAdminEmail, sendTicketReplyEmail } = require('../Services/Nodemailer/sendTicketEmail');

// ─────────────────────────────────────────────
// USER: Create a new support ticket
// ─────────────────────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Title and description are required' });
    }

    // Build attachments array for the initial message
    const attachments = [];
    for (const file of files) {
      try {
        const uploadResult = await uploadToGridFS(file, 'ticketAttachments', {
          senderId: userId,
          type: 'ticket-attachment'
        });
        let fileUrl = uploadResult.fileUrl;
        if (fileUrl.startsWith('/api/files/')) {
          fileUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
        }
        attachments.push({ filename: file.originalname, url: fileUrl, fileType: file.mimetype, size: file.size });
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }

    const ticket = new Ticket({
      title: title.trim(),
      description: description.trim(),
      category: category || 'General',
      priority: priority || 'Medium',
      company: userId,
      messages: [{
        sender: userId,
        senderType: 'user',
        senderName: req.user.fullName,
        content: description.trim(),
        attachments
      }]
    });

    await ticket.save();
    await ticket.populate('company', 'fullName email companyName');

    // Notify admins
    try {
      const notification = new notificationModel({
        title: 'New Support Ticket',
        message: `${req.user.fullName || req.user.email} opened ticket ${ticket.ticketNumber}: ${title}`,
        forAdmin: true
      });
      await notification.save();

      // Send Email to Admins
      const admins = await User.find({ role: { $in: ['admin', 'super admin'] } }).select('email');
      const adminEmails = admins.map(a => a.email);
      for (const email of adminEmails) {
        await sendNewTicketAdminEmail(email, ticket, req.user.fullName || req.user.email);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }

    // Emit socket event to admin room
    try {
      const io = getIo();
      io.to('admin-room').emit('new-ticket', { ticket });
    } catch (err) {}

    res.status(201).json({ status: 'success', message: 'Ticket created successfully', data: ticket });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create ticket' });
  }
};

// ─────────────────────────────────────────────
// USER: Get my tickets
// ─────────────────────────────────────────────
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const filter = { company: userId };
    if (status && status !== 'all') filter.status = status;

    const tickets = await Ticket.find(filter)
      .sort({ lastRepliedAt: -1 })
      .select('-messages')
      .populate('company', 'fullName companyName email')
      .lean();

    res.status(200).json({ status: 'success', data: tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tickets' });
  }
};

// ─────────────────────────────────────────────
// USER / ADMIN: Get a single ticket with messages
// ─────────────────────────────────────────────
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';

    const ticket = await Ticket.findById(ticketId)
      .populate('company', 'fullName companyName email profileImage')
      .populate('messages.sender', 'fullName email role profileImage')
      .lean();

    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket not found' });
    }

    // Only the owner or admin can view
    if (!isAdmin && ticket.company._id.toString() !== userId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch ticket' });
  }
};

// ─────────────────────────────────────────────
// USER: Reply to own ticket
// ─────────────────────────────────────────────
exports.replyToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    if (!content?.trim() && files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Message content or attachment is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';
    if (!isAdmin && ticket.company.toString() !== userId) {
      return res.status(403).json({ status: 'error', message: 'Access denied' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ status: 'error', message: 'Cannot reply to a closed ticket' });
    }

    // Handle file uploads
    const attachments = [];
    for (const file of files) {
      try {
        const uploadResult = await uploadToGridFS(file, 'ticketAttachments', {
          senderId: userId,
          type: 'ticket-reply-attachment'
        });
        let fileUrl = uploadResult.fileUrl;
        if (fileUrl.startsWith('/api/files/')) {
          fileUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
        }
        attachments.push({ filename: file.originalname, url: fileUrl, fileType: file.mimetype, size: file.size });
      } catch (err) {
        console.error('File upload failed:', err);
      }
    }

    const newMessage = {
      sender: userId,
      senderType: isAdmin ? 'admin' : 'user',
      senderName: req.user.fullName,
      content: content?.trim() || '',
      attachments
    };

    ticket.messages.push(newMessage);
    ticket.lastRepliedAt = new Date();

    // Update status when admin replies
    if (isAdmin && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }
    // Reopen if user replies on a resolved ticket
    if (!isAdmin && ticket.status === 'resolved') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticketId)
      .populate('company', 'fullName companyName email')
      .populate('messages.sender', 'fullName email role')
      .lean();

    const addedMessage = populatedTicket.messages[populatedTicket.messages.length - 1];

    // Real-time notification via socket and Email
    try {
      const io = getIo();
      if (isAdmin) {
        // Notify the user via socket
        io.to(ticket.company.toString()).emit('ticket-reply', { ticketId, message: addedMessage, status: ticket.status });
        // Send notification to user
        const notification = new notificationModel({
          title: 'Support Ticket Updated',
          message: `Admin replied to your ticket ${ticket.ticketNumber}: ${ticket.title}`,
          forAdmin: false,
          type: 'message',
          companyId: ticket.company._id
        });
        await notification.save();
        // Send Email to User
        await sendTicketReplyEmail(populatedTicket.company.email, populatedTicket.company.fullName, ticket, content, 'Admin (HDI Support)');
      } else {
        // Notify admin room via socket
        io.to('admin-room').emit('ticket-reply', { ticketId, message: addedMessage, status: ticket.status });
        // Send Email to Admins
        const admins = await User.find({ role: { $in: ['admin', 'super admin'] } }).select('email');
        const adminEmails = admins.map(a => a.email);
        for (const email of adminEmails) {
          await sendTicketReplyEmail(email, 'Admin', ticket, content, req.user.fullName || req.user.email);
        }
      }
    } catch (err) {
      console.error('Socket/notification error:', err);
    }

    res.status(200).json({ status: 'success', message: 'Reply added', data: addedMessage, ticketStatus: ticket.status });
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ status: 'error', message: 'Failed to reply' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Get all tickets
// ─────────────────────────────────────────────
exports.getAllTickets = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';
    if (!isAdmin) return res.status(403).json({ status: 'error', message: 'Access denied' });

    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ticketNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .sort({ lastRepliedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-messages')
      .populate('company', 'fullName companyName email')
      .lean();

    res.status(200).json({
      status: 'success',
      data: { tickets, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch tickets' });
  }
};

// ─────────────────────────────────────────────
// ADMIN: Update ticket status
// ─────────────────────────────────────────────
exports.updateTicketStatus = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super admin';
    if (!isAdmin) return res.status(403).json({ status: 'error', message: 'Access denied' });

    const { ticketId } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const updates = { status };
    if (status === 'resolved') updates.resolvedAt = new Date();
    if (status === 'closed') updates.closedAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(ticketId, updates, { new: true })
      .populate('company', 'fullName companyName email')
      .lean();

    if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });

    // Notify user
    try {
      const io = getIo();
      io.to(ticket.company._id.toString()).emit('ticket-status-updated', { ticketId, status, ticketNumber: ticket.ticketNumber });

      const notification = new notificationModel({
        title: `Ticket ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ticket ${ticket.ticketNumber} has been marked as ${status}`,
        forAdmin: false,
        companyId: ticket.company._id
      });
      await notification.save();
    } catch (err) {}

    res.status(200).json({ status: 'success', message: `Ticket status updated to ${status}`, data: ticket });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update ticket status' });
  }
};
