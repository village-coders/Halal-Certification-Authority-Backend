const logsheetModel = require('../Models/logsheet');
const applicationModel = require('../Models/application');
const userModel = require('../Models/user');
const notificationModel = require('../Models/notification');
const sendTrackingUpdateEmail = require('../Services/Nodemailer/trackingUpdateEmail');
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');

// Create Logsheet (Step 8 Initiator)
const createLogsheet = async (req, res) => {
    const { applicationId, companyName, companyEmail, auditReport, existingAuditReport, existingAdditionalDocuments } = req.body;

    try {
        const application = await applicationModel.findById(applicationId);
        if (!application) return res.status(404).json({ message: 'Application not found' });


        let auditReportUrl = existingAuditReport || auditReport || null; // Pre-filled or string fallback
        let labResultUrl = null;

        if (req.files && req.files['auditReport'] && req.files['auditReport'][0]) {
            const file = req.files['auditReport'][0];
            const bucket = getGridFSBucket('auditReports');
            const filename = `audit-${applicationId}-${Date.now()}-${file.originalname}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: file.mimetype,
                metadata: { applicationId }
            });

            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            await new Promise((resolve, reject) => {
                bufferStream.pipe(uploadStream)
                    .on('error', (err) => reject(err))
                    .on('finish', () => {
                        auditReportUrl = `/files/auditReports/${filename}`;
                        resolve();
                    });
            });
        }

        if (!auditReportUrl) {
            return res.status(400).json({ message: 'Audit report is required' });
        }

        if (req.files && req.files['labResult'] && req.files['labResult'][0]) {
            const file = req.files['labResult'][0];
            // Re-using auditReports bucket for simplicity, or we could use another if it existed, but GridFS is generic enough.
            const bucket = getGridFSBucket('auditReports');
            const filename = `labresult-${applicationId}-${Date.now()}-${file.originalname}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: file.mimetype,
                metadata: { applicationId }
            });

            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            await new Promise((resolve, reject) => {
                bufferStream.pipe(uploadStream)
                    .on('error', (err) => reject(err))
                    .on('finish', () => {
                        labResultUrl = `/files/auditReports/${filename}`;
                        resolve();
                    });
            });
        }

        // Handle additional documents (both pre-existing corrective actions and newly uploaded files)
        const additionalDocumentUrls = [];
        if (existingAdditionalDocuments) {
            let existingDocs = existingAdditionalDocuments;
            if (typeof existingDocs === 'string') {
                try {
                    existingDocs = JSON.parse(existingDocs);
                } catch {
                    existingDocs = [existingDocs];
                }
            }
            if (Array.isArray(existingDocs)) {
                additionalDocumentUrls.push(...existingDocs.filter(Boolean));
            }
        }

        if (req.files && req.files['additionalDocuments'] && req.files['additionalDocuments'].length > 0) {
            const bucket = getGridFSBucket('auditReports');
            for (const file of req.files['additionalDocuments']) {
                const filename = `addoc-${applicationId}-${Date.now()}-${file.originalname}`;
                const uploadStream = bucket.openUploadStream(filename, {
                    contentType: file.mimetype,
                    metadata: { applicationId }
                });

                const bufferStream = new Readable();
                bufferStream.push(file.buffer);
                bufferStream.push(null);

                await new Promise((resolve, reject) => {
                    bufferStream.pipe(uploadStream)
                        .on('error', (err) => reject(err))
                        .on('finish', () => {
                            additionalDocumentUrls.push(`/files/auditReports/${filename}`);
                            resolve();
                        });
                });
            }
        }

        let logsheet;
        const existingLogsheet = await logsheetModel.findOne({ applicationId });
        if (existingLogsheet && existingLogsheet.status !== 'Rejected') {
            return res.status(400).json({ message: 'Logsheet already exists for this application' });
        } else if (existingLogsheet && existingLogsheet.status === 'Rejected') {
            logsheet = existingLogsheet;
            logsheet.companyName = companyName;
            logsheet.companyEmail = companyEmail;
            logsheet.auditReport = auditReportUrl;
            logsheet.labResult = labResultUrl;
            logsheet.additionalDocuments = additionalDocumentUrls;
            logsheet.status = 'Pending';
            logsheet.signatures = [];
            logsheet.isFinalized = false;
            logsheet.rejectionReason = undefined;
            logsheet.updatedAt = new Date();
        } else {
            logsheet = new logsheetModel({
                applicationId,
                companyName,
                companyEmail,
                auditReport: auditReportUrl,
                labResult: labResultUrl,
                additionalDocuments: additionalDocumentUrls
            });
        }

        await logsheet.save();

        // Update application status and shariaBoardSentAt
        const updatedApplication = await applicationModel.findById(applicationId);
        if (updatedApplication) {
            updatedApplication.status = "With Shari'a Board";
            if (!updatedApplication.processData) updatedApplication.processData = {};
            updatedApplication.processData.shariaBoardSentAt = new Date();
            updatedApplication.processData.shariaLogsheetRejectReason = undefined; // Clear previous rejection reason
            // Advance processStep to 8 (Sharia Board Review)
            updatedApplication.processStep = Math.max(updatedApplication.processStep || 0, 8);
            await updatedApplication.save();

            // Fetch all Sharia Board members and notify them
            const shariaMembers = await userModel.find({ 
                privileges: { $in: ["Shari'a Board"] },
                isActive: true
            });
            
            const sendShariaBoardNotificationEmail = require('../Services/Nodemailer/shariaBoardNotificationEmail');
            
            for (const member of shariaMembers) {
                // await sendShariaBoardNotificationEmail(
                //     member.email, 
                //     member.fullName || member.name || "Board Member", 
                //     companyName, 
                //     updatedApplication.applicationNumber
                // );
            }
        }

        res.status(201).json({ status: 'success', logsheet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all Logsheets
const getLogsheets = async (req, res) => {
    try {
        const logsheets = await logsheetModel.find()
            .populate('applicationId')
            .populate('signatures.user', 'fullName email signatureImage')
            .sort({ createdAt: -1 });
        res.json(logsheets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single Logsheet
const getLogsheet = async (req, res) => {
    try {
        const logsheet = await logsheetModel.findOne({ applicationId: req.params.applicationId })
            .populate('applicationId')
            .populate('signatures.user', 'fullName email signatureImage');
        if (!logsheet) return res.status(404).json({ message: 'Logsheet not found' });
        res.json(logsheet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Sign Logsheet
const signLogsheet = async (req, res) => {
    const { logsheetId } = req.body;
    const userId = req.user.id;

    try {
        const logsheet = await logsheetModel.findById(logsheetId);
        if (!logsheet) return res.status(404).json({ message: 'Logsheet not found' });

        if (logsheet.isFinalized) {
            return res.status(400).json({ message: 'Logsheet is already finalized' });
        }

        const user = await userModel.findById(userId);
        if (!user.signatureImage) {
            return res.status(400).json({ message: 'Please upload your signature image in your profile first' });
        }

        // Check if already signed
        const alreadySigned = logsheet.signatures.find(s => s.user.toString() === userId);
        if (alreadySigned) {
            return res.status(400).json({ message: 'You have already signed this logsheet' });
        }

        // Add signature
        logsheet.signatures.push({
            user: userId,
            signerName: user.signatureName || user.fullName,
            signerTitle: user.signatureTitle || "Member, Shari'a Board",
            signedAt: new Date(),
            signatureImage: user.signatureImage
        });

        // Check if all Sharia Board members have signed
        const shariaMembers = await userModel.find({
            privileges: { $in: ["Shari'a Board"] },
            isActive: true
        });

        const signedUsersCount = logsheet.signatures.length;
        const totalShariaMembersCount = shariaMembers.length;

        if (signedUsersCount >= totalShariaMembersCount) {
            logsheet.isFinalized = true;
            logsheet.status = 'Approved';

            const application = await applicationModel.findById(logsheet.applicationId);
            if (application) {
                if (!application.processData) application.processData = {};
                application.processData.shariaBoardApprovedAt = new Date();
                await application.save();
            }
        }

        await logsheet.save();

        res.json({ status: 'success', logsheet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject Logsheet (Shari'a Board)
const rejectLogsheet = async (req, res) => {
    const { logsheetId, reason } = req.body;

    try {
        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const logsheet = await logsheetModel.findById(logsheetId);
        if (!logsheet) return res.status(404).json({ message: 'Logsheet not found' });

        if (logsheet.isFinalized) {
            return res.status(400).json({ message: 'Logsheet is already finalized and approved' });
        }

        // Check if user has permission (Shari'a Board or super admin or admin)
        const isSharia = req.user.role === 'super admin' || req.user.role === 'admin' || (req.user.privileges && req.user.privileges.includes("Shari'a Board"));
        if (!isSharia) {
            return res.status(403).json({ message: 'Unauthorized. Only Shari\'a Board members or Administrators can reject logsheets.' });
        }

        // Update logsheet status to Rejected
        logsheet.status = 'Rejected';
        logsheet.rejectionReason = reason;
        logsheet.signatures = [];
        logsheet.isFinalized = false;
        await logsheet.save();

        // Update application
        const application = await applicationModel.findById(logsheet.applicationId);
        if (application) {
            application.status = "Logsheet Rejected";
            application.processStep = 7; // Send back to step 7 so auditor can recreate
            if (!application.processData) application.processData = {};
            application.processData.shariaBoardSentAt = undefined; // Clear sent timestamp so Create Logsheet button shows up
            application.processData.shariaLogsheetRejectReason = reason; // Store reason
            await application.save();

            // Create notification for auditors/admins
            try {
                const auditors = await userModel.find({
                    $or: [
                        { role: { $in: ['admin', 'super admin'] } },
                        { privileges: { $in: ['Audit Manager', 'Auditor'] } }
                    ],
                    isActive: true
                });

                for (const aud of auditors) {
                    const notification = new notificationModel({
                        title: 'Logsheet Rejected by Shari\'a Board',
                        message: `The logsheet for application ${application.applicationNumber} was rejected by ${req.user.fullName}. Reason: ${reason}`,
                        forAdmin: true,
                        type: 'application',
                        companyId: aud._id,
                        showAsModal: false
                    });
                    await notification.save();
                }
            } catch (err) {
                console.error('Failed to notify auditors of logsheet rejection:', err);
            }
        }

        res.json({ status: 'success', message: 'Logsheet successfully rejected and sent back to auditor', logsheet });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createLogsheet,
    getLogsheets,
    getLogsheet,
    signLogsheet,
    rejectLogsheet
};
