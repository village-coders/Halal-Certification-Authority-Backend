const express = require('express');
const auditRouter = express.Router();
const isLoggedIn = require('../Middlewares/isLoggedIn');
const adminOnly = require('../Middlewares/adminOnly');
const multer = require('multer');

// Configure multer for audit reports
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const {
    scheduleAudit,
    respondToAudit,
    addCorrection,
    resolveCorrection,
    completeAudit,
    getAudits,
    uploadAuditReport,
    sendReminder,
    resendCorrection,
    uploadNcCorrection,
    remindNcCorrection
} = require('../Controllers/auditController');

auditRouter.post('/schedule', isLoggedIn, adminOnly, scheduleAudit);
auditRouter.put('/:id/respond', isLoggedIn, respondToAudit);
auditRouter.put('/:id/correction', isLoggedIn, adminOnly, addCorrection);
auditRouter.put('/:auditId/correction/:correctionId/resolve', isLoggedIn, resolveCorrection);
auditRouter.put('/:auditId/correction/:correctionId/resend', isLoggedIn, adminOnly, resendCorrection);
auditRouter.put('/:id/complete', isLoggedIn, adminOnly, completeAudit);
auditRouter.post('/:id/upload-report', isLoggedIn, adminOnly, upload.single('report'), uploadAuditReport);
auditRouter.post('/:id/reminder', isLoggedIn, adminOnly, sendReminder);
auditRouter.post('/:id/nc-correction', isLoggedIn, upload.array('correctionFile', 10), uploadNcCorrection);
auditRouter.post('/:id/nc-remind', isLoggedIn, adminOnly, remindNcCorrection);
auditRouter.get('/', isLoggedIn, getAudits);

module.exports = auditRouter;
