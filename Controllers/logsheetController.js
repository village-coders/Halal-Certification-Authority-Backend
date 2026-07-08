const logsheetModel = require('../Models/logsheet');
const applicationModel = require('../Models/application');
const userModel = require('../Models/user');
const notificationModel = require('../Models/notification');
const sendTrackingUpdateEmail = require('../Services/Resend/trackingUpdateEmail');
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');

// Create Logsheet (Step 8 Initiator)
const createLogsheet = async (req, res) => {
    const { applicationId, companyName, companyEmail, auditReport } = req.body;

    try {
        const application = await applicationModel.findById(applicationId);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Check if logsheet already exists
        const existingLogsheet = await logsheetModel.findOne({ applicationId });
        if (existingLogsheet) {
            return res.status(400).json({ message: 'Logsheet already exists for this application' });
        }

        let auditReportUrl = auditReport; // Fallback if no file
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

        // Handle additional documents (up to many)
        const additionalDocumentUrls = [];
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

        const logsheet = new logsheetModel({
            applicationId,
            companyName,
            companyEmail,
            auditReport: auditReportUrl,
            labResult: labResultUrl,
            additionalDocuments: additionalDocumentUrls
        });

        await logsheet.save();

        // Update application status and shariaBoardSentAt
        const updatedApplication = await applicationModel.findById(applicationId);
        if (updatedApplication) {
            updatedApplication.status = "With Shari'a Board";
            if (!updatedApplication.processData) updatedApplication.processData = {};
            updatedApplication.processData.shariaBoardSentAt = new Date();
            // Advance processStep to 8 (Sharia Board Review)
            updatedApplication.processStep = Math.max(updatedApplication.processStep || 0, 8);
            await updatedApplication.save();

            // Fetch all Sharia Board members and notify them
            const shariaMembers = await userModel.find({ 
                privileges: { $in: ["Shari'a Board"] },
                isActive: true
            });
            
            const sendShariaBoardNotificationEmail = require('../Services/Resend/shariaBoardNotificationEmail');
            
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

module.exports = {
    createLogsheet,
    getLogsheets,
    getLogsheet,
    signLogsheet
};
