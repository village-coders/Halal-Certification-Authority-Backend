const express = require('express');
const router = express.Router();
const ticketController = require('../Controllers/ticketController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }
});

router.use(isLoggedIn);

// User routes
router.post('/', upload.array('attachments', 5), ticketController.createTicket);
router.get('/my', ticketController.getMyTickets);
router.get('/:ticketId', ticketController.getTicketById);
router.post('/:ticketId/reply', upload.array('attachments', 5), ticketController.replyToTicket);

// Admin routes
router.get('/', ticketController.getAllTickets);
router.put('/:ticketId/status', ticketController.updateTicketStatus);

module.exports = router;
