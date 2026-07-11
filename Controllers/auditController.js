const auditModel = require('../Models/audit');
const applicationModel = require('../Models/application');
const invoiceModel = require('../Models/invoice');
const userModel = require('../Models/user');
const { getGridFSBucket } = require('../Config/connectToDb');
const sendAuditReportUploadedEmail = require('../Services/Resend/auditReportUploadedEmail');
const sendCorrectiveActionReminderEmail = require('../Services/Resend/correctiveActionReminderEmail');
const sendNcCorrectionReminderEmail = require('../Services/Resend/ncCorrectionReminderEmail');
const { Readable } = require('stream');

// Schedule an audit (Admin only)
const scheduleAudit = async (req, res) => {
    const { applicationId, staffName, auditorEmail, auditorPhone, scheduledDate, scheduledTime } = req.body;

    try {
        const application = await applicationModel.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const company = await userModel.findOne({ registrationNo: application.companyId });
        if (!company) {
            return res.status(404).json({ message: 'Company not found' });
        }

        // Verify invoice is paid
        const invoice = await invoiceModel.findOne({ userId: company.id, status: 'Paid' });
        if (!invoice) {
            return res.status(400).json({ message: 'Audit can only be scheduled after invoice is paid' });
        }


        const audit = new auditModel({
            applicationId,
            userId: company.id,
            branchId: application.branchId,
            staffName,
            auditorEmail,
            auditorPhone,
            scheduledDate,
            scheduledTime,
            status: 'Scheduled'
        });

        // Safety check for userId if companyId is not a reference
        if (!audit.userId && application.userId) audit.userId = application.userId;

        await audit.save();
        res.status(201).json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const respondToAudit = async (req, res) => {
    const { id } = req.params;
    const { status, rejectReason, chosenDate, chosenTime, chosenToDate, proposedDates } = req.body; // status: 'Accepted', 'Rejected', or 'CounterProposed'

    try {
        const audit = await auditModel.findById(id);
        if (!audit) {
            return res.status(404).json({ message: 'Audit not found' });
        }

        if (status === 'Accepted') {
            if (!chosenDate || !chosenTime) {
                return res.status(400).json({ message: 'Chosen date and time are required' });
            }
            audit.scheduledDate = new Date(chosenDate);
            audit.scheduledTime = chosenTime;
            if (chosenToDate) audit.scheduledToDate = new Date(chosenToDate);
            audit.status = 'Date Concluded';
            await audit.save();

            if (audit.applicationId) {
                const application = await applicationModel.findById(audit.applicationId);
                if (application && application.processData && application.processData.audit) {
                    application.processData.audit.scheduledDate = new Date(chosenDate);
                    application.processData.audit.scheduledTime = chosenTime;
                    if (chosenToDate) application.processData.audit.scheduledToDate = new Date(chosenToDate);
                    application.processData.audit.status = 'Date Concluded';
                    application.processData.audit.auditRejected = false;
                    application.processData.audit.auditId = audit._id.toString();
                    // Set subStep to 1 so admin can proceed to "Assign Auditors" (sub-step 2)
                    application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 1);
                    application.markModified('processData');
                    await application.save();
                }
            }
        } else if (status === 'CounterProposed') {
            const newProposed = proposedDates || [];
            if (newProposed.length !== 2) {
                return res.status(400).json({ message: 'Proposed dates array must have exactly 2 options' });
            }

            for (let i = 0; i < 2; i++) {
                if (newProposed[i]) {
                    newProposed[i].toDate = newProposed[i].toDate || newProposed[i].date;
                }
            }

            // Check that at most 2 dates/times have changed compared to original audit.proposedDates
            let changedCount = 0;
            const originalProposed = audit.proposedDates || [];
            
            for (let i = 0; i < 2; i++) {
                const origVal = originalProposed[i] ? new Date(originalProposed[i].date).toISOString().split('T')[0] : '';
                const origTime = originalProposed[i] ? originalProposed[i].time : '';
                const newVal = newProposed[i] ? new Date(newProposed[i].date).toISOString().split('T')[0] : '';
                const newTime = newProposed[i] ? newProposed[i].time : '';
                
                if (origVal !== newVal || origTime !== newTime) {
                    changedCount++;
                    if (newProposed[i]) {
                        newProposed[i].isCounter = true;
                    }
                } else {
                    if (newProposed[i]) {
                        newProposed[i].isCounter = originalProposed[i] ? originalProposed[i].isCounter : false;
                    }
                }
            }

            if (changedCount > 2) {
                return res.status(400).json({ message: 'You can request changes for at most 2 dates' });
            }

            audit.proposedDates = newProposed;
            audit.status = 'Counter Proposed';
            await audit.save();

            if (audit.applicationId) {
                const application = await applicationModel.findById(audit.applicationId);
                if (application && application.processData && application.processData.audit) {
                    application.processData.audit.proposedDates = newProposed;
                    application.processData.audit.status = 'Counter Proposed';
                    application.processData.audit.auditRejected = false;
                    application.markModified('processData');
                    await application.save();
                }
            }
        } else if (status === 'Rejected') {
            if (!rejectReason) {
                return res.status(400).json({ message: 'Reject reason is required if rejecting' });
            }
            audit.status = 'Rejected';
            audit.rejectReason = rejectReason;
            await audit.save();

            if (audit.applicationId) {
                const application = await applicationModel.findById(audit.applicationId);
                if (application && application.processData && application.processData.audit) {
                    application.processData.audit.auditRejected = true;
                    application.processData.audit.rejectReason = rejectReason;
                    application.processData.audit.status = 'Rejected';
                    application.processData.audit.subStep = 0; // Reset subStep back to 0 to force reschedule
                    application.markModified('processData');
                    await application.save();
                }
            }
        }

        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add correction (Admin/Staff)
const addCorrection = async (req, res) => {
    const { id } = req.params;
    const { issue } = req.body;

    try {
        const audit = await auditModel.findById(id);
        if (!audit) {
            return res.status(404).json({ message: 'Audit not found' });
        }

        audit.corrections.push({ issue, status: 'Pending' });
        audit.status = 'NC Flagged';

        await audit.save();
        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Resolve correction (User)
const resolveCorrection = async (req, res) => {
    const { auditId, correctionId } = req.params;

    try {
        const audit = await auditModel.findById(auditId);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        const correction = audit.corrections.id(correctionId);
        if (!correction) return res.status(404).json({ message: 'Correction not found' });

        correction.status = 'Resolved';
        correction.resolvedAt = new Date();

        await audit.save();

        // Check if all corrections are now resolved
        const pendingCount = audit.corrections.filter(c => c.status === 'Pending').length;
        if (pendingCount === 0) {
            await applicationModel.findByIdAndUpdate(audit.applicationId, {
                status: 'With Shari\'a Board'
            });
        }

        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Resend correction if not acceptable (Admin)
const resendCorrection = async (req, res) => {
    const { auditId, correctionId } = req.params;

    try {
        const audit = await auditModel.findById(auditId);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        const correction = audit.corrections.id(correctionId);
        if (!correction) return res.status(404).json({ message: 'Correction not found' });

        correction.status = 'Pending';
        correction.resolvedAt = undefined;
        audit.status = 'NC Flagged';

        await audit.save();

        // Update application status back if it was moved forward
        await applicationModel.findByIdAndUpdate(audit.applicationId, {
            status: 'Accepted' // Revert to accepted/audit phase
        });

        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload Audit Report (Admin)
const uploadAuditReport = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const audit = await auditModel.findById(id).populate('userId');
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        // Save to GridFS
        const bucket = getGridFSBucket('auditReports');
        const filename = `audit-report-${Date.now()}-${req.file.originalname}`;
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                auditId: id,
                applicationId: audit.applicationId,
                companyName: audit.userId.companyName
            }
        });

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        await new Promise((resolve, reject) => {
            bufferStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        const fileId = uploadStream.id;
        audit.auditReport = `${req.protocol}://${req.get('host')}/api/files/${fileId}`;
        audit.reportUploadedAt = new Date();

        await audit.save();

        // Send email to client using Resend
        await sendAuditReportUploadedEmail(
            audit.userId.email,
            audit.userId.companyName,
            audit.applicationId
        );

        res.json({ message: 'Report uploaded and client notified', audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send Correction Reminder (Admin)
const sendReminder = async (req, res) => {
    const { id } = req.params;

    try {
        const audit = await auditModel.findById(id).populate('userId');
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        const pending = audit.corrections.filter(c => c.status === 'Pending');
        if (pending.length === 0) {
            return res.status(400).json({ message: 'No pending corrections to remind about' });
        }

        // Send corrective action reminder using Resend
        await sendCorrectiveActionReminderEmail(
            audit.userId.email,
            audit.userId.companyName,
            pending
        );

        res.json({ message: 'Reminder sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Complete audit (Admin)
const completeAudit = async (req, res) => {
    const { id } = req.params;

    try {
        const audit = await auditModel.findById(id);
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        // Check if all corrections are resolved
        const pendingCorrections = audit.corrections.filter(c => c.status === 'Pending');
        if (pendingCorrections.length > 0) {
            return res.status(400).json({ message: 'All corrections must be resolved before completing audit' });
        }

        audit.status = 'Completed';
        audit.completedAt = new Date();

        await audit.save();

        // Optionally update application status to 'Completed/Certified' or similar
        // User mentioned: "when there is no correction the admin can now generate a certificate"

        res.json(audit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get audits
const getAudits = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin' && req.user.role !== 'super admin') {
            filter.userId = req.user.id;
        }

        const audits = await auditModel.find(filter)
            .populate('applicationId', 'applicationNumber category')
            .populate('userId', 'companyName fullName')
            .populate('branchId', 'branchName address city state')
            .sort({ createdAt: -1 });

        res.json(audits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload NC Correction (Client)
const uploadNcCorrection = async (req, res) => {
    const { id } = req.params;

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No correction files uploaded' });
        }

        // Validate file sizes (5MB limit)
        for (const fileObj of req.files) {
            if (fileObj.size > 5 * 1024 * 1024) {
                return res.status(400).json({ message: `File "${fileObj.originalname}" exceeds the 5MB size limit.` });
            }
        }

        const audit = await auditModel.findById(id).populate('userId');
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        if (audit.status !== 'NC Flagged' && audit.status !== 'Correction Needed') {
            return res.status(400).json({ message: 'NC correction upload is not allowed at this stage. The NC report might already be closed.' });
        }

        const fileUrls = [];

        for (const fileObj of req.files) {
            // Save to GridFS
            const bucket = getGridFSBucket('auditReports');
            const filename = `nc-correction-${Date.now()}-${fileObj.originalname}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: fileObj.mimetype,
                metadata: {
                    auditId: id,
                    applicationId: audit.applicationId,
                    companyName: audit.userId.companyName
                }
            });

            const bufferStream = new Readable();
            bufferStream.push(fileObj.buffer);
            bufferStream.push(null);

            await new Promise((resolve, reject) => {
                bufferStream.pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            const fileId = uploadStream.id;
            fileUrls.push(`/api/files/${fileId}`);
        }

        audit.ncCorrectionFile = fileUrls;
        audit.ncCorrectionUploadedAt = new Date();
        audit.ncRejectReason = undefined;
        audit.ncRejectFiles = [];

        await audit.save();

        if (audit.applicationId) {
            const application = await applicationModel.findById(audit.applicationId);
            if (application && application.processData && application.processData.audit) {
                application.processData.audit.ncCorrectionFile = audit.ncCorrectionFile;
                application.processData.audit.ncCorrectionUploadedAt = audit.ncCorrectionUploadedAt;
                application.processData.audit.ncRejectReason = undefined;
                application.processData.audit.ncRejectFiles = [];
                application.markModified('processData');
                await application.save();
            }
        }

        res.json({ message: 'NC Correction uploaded successfully', audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send NC Correction Reminder (Admin)
const remindNcCorrection = async (req, res) => {
    const { id } = req.params;

    try {
        const audit = await auditModel.findById(id).populate('userId');
        if (!audit) return res.status(404).json({ message: 'Audit not found' });

        // Check if client has already uploaded (array check)
        const hasUploaded = Array.isArray(audit.ncCorrectionFile)
            ? audit.ncCorrectionFile.length > 0
            : !!audit.ncCorrectionFile;
        if (hasUploaded) {
            return res.status(400).json({ message: 'Client has already uploaded a correction' });
        }

        audit.ncReminderSentAt = new Date();
        await audit.save();

        if (audit.applicationId) {
            const application = await applicationModel.findById(audit.applicationId);
            if (application && application.processData && application.processData.audit) {
                application.processData.audit.ncReminderSentAt = audit.ncReminderSentAt;
                application.markModified('processData');
                await application.save();
            }
        }

        // Send dedicated NC correction reminder email
        await sendNcCorrectionReminderEmail(
            audit.userId.email,
            audit.userId.companyName
        );

        res.json({ message: 'NC Correction reminder sent to client', audit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    scheduleAudit,
    respondToAudit,
    addCorrection,
    resolveCorrection,
    resendCorrection,
    uploadAuditReport,
    sendReminder,
    completeAudit,
    getAudits,
    uploadNcCorrection,
    remindNcCorrection
};
