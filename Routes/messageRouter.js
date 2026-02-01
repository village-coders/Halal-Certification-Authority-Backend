const express = require('express');
const router = express.Router();
const messageController = require('../Controllers/messageController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const multer = require('multer');

// Configure multer for memory storage (for Supabase upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per message
  }
});

// Apply authentication middleware to all routes
router.use(isLoggedIn);

// User routes
router.get('/', messageController.getUserMessages);
router.get('/admin/conversation', messageController.getAdminConversation);
router.get('/unread/count', messageController.getUnreadCount);
router.post('/send', upload.array('attachments', 5), messageController.sendMessage);
router.put('/:messageId/read', messageController.markAsRead);

// Admin routes (admin only)
// router.get('/admin/all', messageController.getAllMessages);
router.post('/admin/send', upload.array('attachments', 5), messageController.sendAdminMessage);
router.get('/admin/all', isLoggedIn, messageController.getAllUserConversations);
router.get('/admin/conversation/:userId', isLoggedIn, messageController.getUserConversation);
router.put('/admin/mark-read/:userId', isLoggedIn, messageController.markUserConversationAsRead);
router.put('/admin/mark-all-read', isLoggedIn, messageController.markAllAsRead);
router.put('/admin/archive/:conversationId', isLoggedIn, messageController.archiveConversation);
router.delete('/admin/:conversationId', isLoggedIn, messageController.deleteConversation);

module.exports = router;