const express = require('express');
const invoiceRouter = express.Router();
const {
    adminCreateInvoice,
    issueInvoice,
    payInvoice,
    uploadProofOfPayment,
    approvePayment,
    rejectInvoice,
    resendInvoice,
    getInvoices,
    getInvoiceById
} = require('../Controllers/invoiceController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const adminOnly = require('../Middlewares/adminOnly');
const resolveCompanyUser = require('../Middlewares/resolveCompanyUser');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

invoiceRouter.post('/admin-create', isLoggedIn, adminOnly, upload.single('invoiceFile'), adminCreateInvoice);
invoiceRouter.put('/:id/issue', isLoggedIn, adminOnly, issueInvoice);
invoiceRouter.put('/:id/pay', isLoggedIn, resolveCompanyUser, payInvoice);
invoiceRouter.post('/:id/upload-proof', isLoggedIn, resolveCompanyUser, upload.single('proof'), uploadProofOfPayment);
invoiceRouter.put('/:id/approve-payment', isLoggedIn, adminOnly, approvePayment);
invoiceRouter.put('/:id/reject', isLoggedIn, resolveCompanyUser, rejectInvoice);
invoiceRouter.put('/:id/resend', isLoggedIn, adminOnly, resendInvoice);
invoiceRouter.get('/', isLoggedIn, resolveCompanyUser, getInvoices);
invoiceRouter.get('/:id', isLoggedIn, resolveCompanyUser, getInvoiceById);

module.exports = invoiceRouter;
