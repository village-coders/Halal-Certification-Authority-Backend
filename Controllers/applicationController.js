const applicationModel = require('../Models/application');
const userModel = require('../Models/user');
const notificationModel = require('../Models/notification');
const auditModel = require('../Models/audit');
const invoiceModel = require('../Models/invoice');
const certificateModel = require('../Models/certificate');
const productModel = require('../Models/product');
const { checkAndStatusSync } = require('./certificateController');
const sendAuditScheduledEmail = require('../Services/Nodemailer/auditScheduledEmail');
const sendVerificationEmail = require('../Services/Nodemailer/sendVerificationEmail');
const sendTrackingUpdateEmail = require('../Services/Nodemailer/trackingUpdateEmail');
const newApplicationEmail = require('../Services/Nodemailer/newApplicationEmail');
const applicationSubmittedEmail = require('../Services/Nodemailer/applicationSubmittedEmail');
const applicationAcceptedEmail = require('../Services/Nodemailer/applicationAcceptedEmail');
const auditDatesProposedEmail = require('../Services/Nodemailer/auditDatesProposedEmail');
const auditorsAssignedEmail = require('../Services/Nodemailer/auditorsAssignedEmail');
const auditCompletedEmail = require('../Services/Nodemailer/auditCompletedEmail');
const ncFlaggedEmail = require('../Services/Nodemailer/ncFlaggedEmail');
const ncClosedEmail = require('../Services/Nodemailer/ncClosedEmail');
const ncRejectedEmail = require('../Services/Nodemailer/ncRejectedEmail');
const sentToShariaBoardEmail = require('../Services/Nodemailer/sentToShariaBoardEmail');
const finalAuditReportUploadedEmail = require('../Services/Nodemailer/finalAuditReportUploadedEmail');
const applicationSuccessfulEmail = require('../Services/Nodemailer/applicationSuccessfulEmail');
const certificateIssuedEmail = require('../Services/Nodemailer/certificateIssuedEmail');
const invoiceIssuedEmail = require('../Services/Nodemailer/invoiceIssuedEmail');
const paymentReceivedEmail = require('../Services/Nodemailer/paymentReceivedEmail');

const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const getCompanyMemberEmails = require('../Utils/getCompanyMemberEmails');

const getCompanyRecipients = async (registrationNo, fallbackUser) => {
    if (!registrationNo) return fallbackUser?.email ? [fallbackUser.email] : [];
    const emails = await getCompanyMemberEmails(registrationNo);
    return emails.length > 0 ? emails : (fallbackUser?.email ? [fallbackUser.email] : []);
};

// Configure multer for process file uploads (5MB limit)
const processUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const uploadFileToGridFS = async (req, fileObj, applicationId, stepNum = 1, subStep = 0, convertToPdf = false) => {
    const bucket = getGridFSBucket('applicationFiles');

    if (convertToPdf && fileObj.mimetype.startsWith('image/')) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ autoFirstPage: false });
                let chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    const finalName = `app-${applicationId}-${Date.now()}-${fileObj.originalname.split('.')[0]}.pdf`;
                    const uploadStream = bucket.openUploadStream(finalName, {
                        contentType: 'application/pdf',
                        metadata: { applicationId, step: stepNum, subStep }
                    });
                    const bufferStream = new Readable();
                    bufferStream.push(pdfBuffer);
                    bufferStream.push(null);
                    bufferStream.pipe(uploadStream)
                        .on('error', reject)
                        .on('finish', () => resolve({
                            id: uploadStream.id,
                            path: `/api/files/${uploadStream.id}`
                        }));
                });

                const img = doc.openImage(fileObj.buffer);
                doc.addPage({ size: [img.width, img.height] });
                doc.image(img, 0, 0);
                doc.end();
            } catch (e) {
                reject(e);
            }
        });
    }

    const filename = `app-${applicationId}-${Date.now()}-${fileObj.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: fileObj.mimetype,
        metadata: {
            applicationId,
            step: stepNum,
            subStep
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
    return {
        id: fileId,
        path: `/api/files/${fileId}`
    };
};

// Get all applications
const getApplications = async (req, res) => {
    const query = req.query
    const company = req.user

    try {
        await checkAndStatusSync();
        let build = {}
        if (query.status) {
            build.status = query.status
        }
        if (query.category) {
            build.category = query.category
        }

        // Ownership check: Non-admins only see their own applications
        if (req.user.role !== "admin" && req.user.role !== "super admin") {
            if (!company.registrationNo) {
                return res.status(400).json({ message: "Registration number missing from user profile" });
            }
            build.companyId = company.registrationNo;
        }

        const applications = await applicationModel.find(build).sort({ createdAt: -1 }).populate('company', 'companyName registrationNo email phone address').populate('branchId')
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single application
const getApplication = async (req, res) => {
    try {
        await checkAndStatusSync();
        const application = await applicationModel.findById(req.params.id).populate('company', 'companyName registrationNo email phone address').populate('branchId')
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Ownership check
        if (req.user.role !== "admin" && req.user.role !== "super admin" && application.companyId !== req.user.registrationNo) {
            return res.status(403).json({ message: 'Access denied. You do not own this application.' });
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create application
const createApplication = async (req, res) => {
    const id = req.user.id
    const { category, branchId } = req.body

    if (!branchId) {
        return res.status(400).json({ message: 'Branch selection is required' });
    }

    try {
        // Always use the parent company's data when a sub-user creates an application
        const companyId = req.companyOwnerId || id;
        const company = await userModel.findById(companyId);

        if (!company) {
            return res.status(404).json({ message: 'Company account not found.' });
        }

        // Verify branch exists and belongs to company (use companyOwnerId for sub-users)
        const branchOwner = req.companyOwnerId || id;
        const branch = await require("../Models/branch").findOne({ _id: branchId, companyId: branchOwner });
        if (!branch) {
            return res.status(400).json({ message: 'Invalid branch selected' });
        }

        // Check application eligibility & duplicate in-progress applications
        if (category === 'Ad-On Application' || category === 'Ad-On') {
            // 1. Verify that this branch has an already certified application or active certificate
            const hasCertifiedApp = await applicationModel.findOne({
                branchId: branchId,
                status: "Issued"
            });
            const hasCertificate = await certificateModel.findOne({
                branchId: branchId,
                status: { $in: ["Active", "Expiring Soon", "Expired"] }
            });

            if (!hasCertifiedApp && !hasCertificate) {
                return res.status(400).json({
                    message: `This site (${branch.branchName}) does not have an initial certified application. Only sites with an already certified application can apply for an Ad-On application.`
                });
            }

            // 2. Check if an active Ad-On application is already in progress for this branch
            const existingAdOn = await applicationModel.findOne({
                companyId: company.registrationNo,
                branchId: branchId,
                category: "Ad-On Application",
                status: { $nin: ["Issued", "Rejected", "Expired"] }
            });

            if (existingAdOn) {
                return res.status(400).json({
                    message: `An active Ad-On application is already in progress for this branch (${branch.branchName}).`
                });
            }
        } else if (category === 'Renewal Application') {
            const { renewedCertificateId, renewedApplicationId } = req.body;

            if (renewedCertificateId) {
                const existingRenewal = await applicationModel.findOne({
                    companyId: company.registrationNo,
                    renewedCertificateId: renewedCertificateId,
                    category: "Renewal Application",
                    status: { $nin: ["Issued", "Rejected", "Expired"] }
                });

                if (existingRenewal) {
                    return res.status(400).json({
                        message: `An active renewal application is already in progress for this certificate.`
                    });
                }
            } else if (renewedApplicationId) {
                const existingRenewal = await applicationModel.findOne({
                    companyId: company.registrationNo,
                    renewedApplicationId: renewedApplicationId,
                    category: "Renewal Application",
                    status: { $nin: ["Issued", "Rejected", "Expired"] }
                });

                if (existingRenewal) {
                    return res.status(400).json({
                        message: `An active renewal application is already in progress for this application.`
                    });
                }
            } else {
                const totalBranchCerts = await certificateModel.countDocuments({
                    companyId: company.registrationNo,
                    branchId: branchId,
                    status: { $in: ["Active", "Expiring Soon", "Expired"] }
                });
                const activeRenewals = await applicationModel.countDocuments({
                    companyId: company.registrationNo,
                    branchId: branchId,
                    category: "Renewal Application",
                    status: { $nin: ["Issued", "Rejected", "Expired"] }
                });

                if (totalBranchCerts > 0 && activeRenewals >= totalBranchCerts) {
                    return res.status(400).json({
                        message: `All certificates for this branch (${branch.branchName}) already have active renewal applications in progress.`
                    });
                } else if (totalBranchCerts === 0 && activeRenewals > 0) {
                    return res.status(400).json({
                        message: `An active renewal application is already in progress for this branch (${branch.branchName}).`
                    });
                }
            }
        } else {
            // Check if there is an active initial application for this branch
            const existingApplication = await applicationModel.findOne({
                companyId: company.registrationNo,
                branchId: branchId,
                category: { $nin: ['Renewal Application', 'Ad-On Application', 'Ad-On'] },
                status: { $nin: ["Rejected", "Expired"] }
            });

            if (existingApplication) {
                return res.status(400).json({
                    message: `An active initial application already exists for this branch (${branch.branchName}).`
                });
            }
        }

        // Generate application number & type
        const timestamp = Date.now().toString().slice(-8);
        const prefix = company.companyName?.slice(0, 2).toUpperCase();

        let applicationNumber;
        let appType = "New";
        if (category === 'Renewal Application') {
            applicationNumber = `${prefix}REN-${timestamp}`;
            appType = "Renewal";
        } else if (category === 'Ad-On Application' || category === 'Ad-On') {
            applicationNumber = `${prefix}ADD-${timestamp}`;
            appType = "Ad-On";
        } else {
            applicationNumber = `${prefix}-APP-${timestamp}`;
            appType = "New";
        }

        // Process foodSafetyPrograms if it's a string
        let foodSafetyPrograms = req.body.foodSafetyPrograms;
        if (typeof foodSafetyPrograms === 'string') {
            foodSafetyPrograms = foodSafetyPrograms.split(',').filter(p => p.trim() !== '');
        }

        // Process productList if it's a string (comma-separated product names from form)
        let productList = req.body.productList;
        if (typeof productList === 'string') {
            productList = productList.split(',').filter(p => p.trim() !== '');
        }
        productList = Array.isArray(productList) ? productList : [];

        // Process geographicMarkets if it's a string
        let geographicMarkets = req.body.geographicMarkets;
        if (typeof geographicMarkets === 'string') {
            geographicMarkets = geographicMarkets.split(',').filter(m => m.trim() !== '');
        }

        // Helper function for safe JSON parsing
        const safeParse = (data) => {
            if (!data) return {};
            if (typeof data !== 'string') return data;
            try {
                return JSON.parse(data);
            } catch (e) {
                throw new Error(`Invalid JSON format in field: ${data}`);
            }
        };

        // Handle JSON fields safely
        const manufacturingFacility = safeParse(req.body.manufacturingFacility);
        const additionalFacilities = req.body.additionalFacilities ?
            (typeof req.body.additionalFacilities === 'string' ? JSON.parse(req.body.additionalFacilities) : req.body.additionalFacilities)
            : [];
        const packagingPlant = safeParse(req.body.packagingPlant);
        const authorizedBy = safeParse(req.body.authorizedBy);
        const primaryContact = safeParse(req.body.primaryContact);

        const applicationData = {
            ...req.body,
            type: appType,
            applicationNumber,
            companyId: company.registrationNo,
            company: company._id,
            requestedDate: req.body.requestedDate || new Date(),
            foodSafetyPrograms,
            geographicMarkets,
            manufacturingFacility,
            additionalFacilities,
            packagingPlant,
            authorizedBy,
            primaryContact,
            renewedCertificateId: req.body.renewedCertificateId || undefined,
            renewedApplicationId: req.body.renewedApplicationId || undefined
        };

        // Validate required fields
        if (!applicationData.primaryContact || !applicationData.primaryContact.name || !applicationData.primaryContact.email || !applicationData.primaryContact.positionTitle || !applicationData.primaryContact.telephoneNo) {
            return res.status(400).json({
                message: 'All Primary Contact fields (Name, Email, Position/Title, and Phone Number) are required and compulsory'
            });
        }

        if (!req.files || !req.files['rawMaterialsDocument'] || req.files['rawMaterialsDocument'].length === 0) {
            return res.status(400).json({
                message: 'List of raw materials document is compulsory'
            });
        }

        if (!applicationData.hasAppliedBefore) {
            return res.status(400).json({
                message: 'Has the company ever applied for Halal certification previously? is required'
            });
        }

        if (!applicationData.hasBeenSupervisedBefore) {
            return res.status(400).json({
                message: 'Has the factory ever been supervised before? is required'
            });
        }

        if (!applicationData.foodSafetyPrograms || applicationData.foodSafetyPrograms.length === 0) {
            return res.status(400).json({
                message: 'Please state all food safety programs implemented at the factory'
            });
        }

        // Clear agency fields if answer is "no"
        if (applicationData.hasAppliedBefore === 'no') {
            applicationData.previousHalalAgency = '';
        }

        if (applicationData.hasBeenSupervisedBefore === 'no') {
            applicationData.supervisingHalalAgency = '';
        }

        const application = new applicationModel(applicationData);
        const savedApplication = await application.save();

        // Upload documents if they exist
        const fileFields = ['mancapDocument', 'nafdacDocument', 'cacDocument', 'companyProfileDocument', 'rawMaterialsDocument'];
        let filesUpdated = false;

        if (req.files) {
            for (const field of fileFields) {
                if (req.files[field] && req.files[field].length > 0) {
                    const uploaded = await uploadFileToGridFS(req, req.files[field][0], savedApplication._id.toString(), 1, 0, false);
                    savedApplication[field] = uploaded.path;
                    filesUpdated = true;
                }
            }
            if (filesUpdated) {
                await savedApplication.save();
            }
        }

        try {
            const notification = new notificationModel({
                title: 'New Application',
                message: `${company.companyName || company.fullName} submitted a new application (${applicationNumber})`,
                forAdmin: true,
                companyId: company._id
            });
            await notification.save();
        } catch (err) {
            console.error('Failed to create notification', err);
        }

        // Notify ALL admins and super admins by email
        try {
            const allAdmins = await userModel.find({
                role: { $in: ['admin', 'super admin'] }
            }).select('email');
            const adminEmails = allAdmins.map(a => a.email).filter(Boolean);
            if (adminEmails.length > 0) {
                newApplicationEmail(
                    adminEmails,
                    company.companyName || company.fullName || 'A Client',
                    applicationNumber,
                    category
                ).catch(err => console.error('Failed to send new application admin email:', err));
            }
        } catch (err) {
            console.error('Failed to fetch admins for new application email:', err);
        }

        // Notify ALL company members by email (parent + sub-users)
        if (company && company.email) {
            const getCompanyMemberEmails = require('../Utils/getCompanyMemberEmails');
            getCompanyMemberEmails(company.registrationNo).then(memberEmails => {
                const recipients = memberEmails.length > 0 ? memberEmails : [company.email];
                applicationSubmittedEmail(
                    recipients,
                    company.companyName || company.fullName || 'Valued Client',
                    applicationNumber,
                    category
                ).catch(err => console.error('Failed to send application submission email to company:', err));
            }).catch(err => console.error('Failed to get company member emails:', err));
        }

        // Create Product documents for each product listed
        if (productList && productList.length > 0) {
            try {
                // For renewal applications: delete old products first so only the new list remains
                if (category === 'Renewal Application') {
                    await productModel.deleteMany({ companyId: company.registrationNo });
                }

                const productDocs = productList
                    .filter(name => name.trim())
                    .map(name => ({
                        name: name.trim(),
                        companyId: company.registrationNo,
                        applicationId: savedApplication._id,
                        branchId: savedApplication.branchId,
                        createdBy: company._id,
                        status: 'requested'
                    }));
                await productModel.insertMany(productDocs);
            } catch (err) {
                console.error('Failed to create products for application', err);
            }
        } else if (category === 'Renewal Application') {
            // Even if the client submits no product list, clear old products
            try {
                await productModel.deleteMany({ companyId: company.registrationNo });
            } catch (err) {
                console.error('Failed to delete old products on renewal', err);
            }
        }

        if (category === 'Renewal Application') {
            try {
                await certificateModel.updateMany(
                    {
                        companyId: company.registrationNo,
                        branchId: branchId,
                        status: { $in: ['Expired', 'Expiring Soon'] }
                    },
                    { $set: { status: 'Inactive' } }
                );
            } catch (err) {
                console.error('Failed to update old certificates to inactive', err);
            }
        }

        res.status(201).json(savedApplication);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update application
const updateApplication = async (req, res) => {
    try {
        const application = await applicationModel.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Ownership check
        if (req.user.role !== "admin" && req.user.role !== "super admin" && application.companyId !== req.user.registrationNo) {
            return res.status(403).json({ message: 'Access denied. You do not own this application.' });
        }

        const updateData = { ...req.body };

        // Process arrays if they're strings
        if (typeof updateData.foodSafetyPrograms === 'string') {
            updateData.foodSafetyPrograms = updateData.foodSafetyPrograms.split(',').filter(p => p.trim() !== '');
        }

        if (typeof updateData.geographicMarkets === 'string') {
            updateData.geographicMarkets = updateData.geographicMarkets.split(',').filter(m => m.trim() !== '');
        }

        // Parse JSON fields if they're strings safely
        ['manufacturingFacility', 'additionalFacilities', 'packagingPlant', 'authorizedBy', 'primaryContact'].forEach(field => {
            if (updateData[field] && typeof updateData[field] === 'string') {
                try {
                    updateData[field] = JSON.parse(updateData[field]);
                } catch (e) {
                    // If parsing fails, we could return 400 or ignore. Let's return 400 for better feedback.
                    throw new Error(`Invalid JSON format in field: ${field}`);
                }
            }
        });

        if (updateData.primaryContact && (!updateData.primaryContact.name || !updateData.primaryContact.email || !updateData.primaryContact.positionTitle || !updateData.primaryContact.telephoneNo)) {
            return res.status(400).json({
                message: 'All Primary Contact fields (Name, Email, Position/Title, and Phone Number) must be populated'
            });
        }

        // Clear agency fields if answer is "no"
        if (updateData.hasAppliedBefore === 'no') {
            updateData.previousHalalAgency = '';
        }

        if (updateData.hasBeenSupervisedBefore === 'no') {
            updateData.supervisingHalalAgency = '';
        }

        const updatedApplication = await applicationModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete application
const deleteApplication = async (req, res) => {
    try {
        const application = await applicationModel.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // Ownership check
        if (req.user.role !== "admin" && req.user.role !== "super admin" && application.companyId !== req.user.registrationNo) {
            return res.status(403).json({ message: 'Access denied. You do not own this application.' });
        }

        await applicationModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get applications for renewal (only Accepted or Certified)
const getRenewalApplications = async (req, res) => {
    const company = req.user

    try {
        let build = {
            status: { $in: ['Accepted', 'Certified'] }
        };

        // If not admin, only show their own applications
        if (req.user.role !== "admin" && company.registrationNo && req.user.role !== "super admin") {
            build.companyId = company.registrationNo;
        }

        const applications = await applicationModel.find(build)
            .select('applicationNumber category product createdAt hasAppliedBefore previousHalalAgency hasBeenSupervisedBefore supervisingHalalAgency foodSafetyPrograms')
            .sort({ createdAt: -1 })
            .populate('company', 'companyName registrationNo email phone address');

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search applications
const searchApplications = async (req, res) => {
    const { applicationNumber, date, status, category } = req.query;
    const company = req.user;

    try {
        let build = {};

        // Application number search
        if (applicationNumber) {
            build.applicationNumber = { $regex: applicationNumber, $options: 'i' };
        }

        // Date search (assuming date is in YYYY-MM-DD format)
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            build.createdAt = {
                $gte: startDate,
                $lt: endDate
            };
        }

        // Status filter
        if (status) {
            build.status = status;
        }

        // Category filter
        if (category) {
            build.category = category;
        }

        // If not admin, only show their own applications
        if (req.user.role !== "admin" && company.registrationNo && req.user.role !== "super admin") {
            build.companyId = company.registrationNo;
        }

        const applications = await applicationModel.find(build)
            .sort({ createdAt: -1 });

        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const rejectApplication = async (req, res) => {
    const { id } = req.params
    const { reason } = req.body
    try {
        const application = await applicationModel.findById(id)
        if (!application) {
            return res.status(404).json({
                status: "error",
                message: "No application with this id found"
            })
        }

        application.reason = reason
        application.status = "Rejected"

        await application.save()

        // Delete all products associated with this rejected application instantly
        try {
            await productModel.deleteMany({ applicationId: application._id });
            console.log(`🗑️ Deleted products for rejected application: ${application._id}`);
        } catch (err) {
            console.error('Failed to delete products for rejected application:', err);
        }

        const company = await userModel.findOne({ registrationNo: application.companyId });
        if (company) {
            try {
                const title = 'Application Rejected';
                const message = `Your application (${application.applicationNumber}) has been rejected. Next Step: Please review the rejection reason and contact support if you need further clarification.`;
                const notification = new notificationModel({
                    title,
                    message,
                    forAdmin: false,
                    type: 'application',
                    companyId: company._id
                });
                await notification.save();

                // Send email notification to all company members
                getCompanyRecipients(application.companyId, company).then(recipients => {
                    if (recipients.length > 0) {
                        sendTrackingUpdateEmail(
                            recipients,
                            company.companyName || company.fullName || 'Valued Client',
                            application.applicationNumber,
                            title,
                            message
                        ).catch(err => console.error('Failed to send tracking email:', err));
                    }
                }).catch(err => console.error('Failed to resolve recipients:', err));
            } catch (err) {
                console.error(err);
            }
        }

        res.status(200).json({
            status: "success",
            message: "Application rejected successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const acceptApplication = async (req, res) => {
    const { id } = req.params
    const { reason } = req.body
    try {
        const application = await applicationModel.findById(id)
        if (!application) {
            return res.status(404).json({
                status: "error",
                message: "No application with this id found"
            })
        }

        if (reason) application.reason = reason
        application.status = "Accepted"
        // Advance to step 2 (Application Accepted) if still at step 1
        if (application.processStep < 2) {
            application.processStep = 2;
            if (!application.processData) application.processData = {};
            application.processData.acceptedAt = new Date();
        }

        await application.save()

        const company = await userModel.findOne({ registrationNo: application.companyId });
        if (company) {
            try {
                const title = 'Application Accepted';
                const message = `Your application (${application.applicationNumber}) has been accepted!`;
                const notification = new notificationModel({
                    title,
                    message,
                    forAdmin: false,
                    type: 'application',
                    companyId: company._id
                });
                await notification.save();

                // Send email notification to all company members
                getCompanyRecipients(application.companyId, company).then(recipients => {
                    if (recipients.length > 0) {
                        applicationAcceptedEmail(
                            recipients,
                            company.companyName || company.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send application accepted email:', err));
                    }
                }).catch(err => console.error('Failed to resolve recipients:', err));
            } catch (err) {
                console.error(err);
            }
        }

        res.status(200).json({
            status: "success",
            message: "Application accepted successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const renewApplication = async (req, res) => {
    const { id } = req.params;
    try {
        const sourceApplication = await applicationModel.findById(id);

        if (!sourceApplication) {
            return res.status(404).json({
                status: "error",
                message: "No application with this id found"
            });
        }

        // Check if an active application for this company already exists
        const existingRenewal = await applicationModel.findOne({
            companyId: sourceApplication.companyId,
            category: "Renewal Application",
            status: { $nin: ["Issued", "Rejected", "Expired"] }
        });

        if (existingRenewal) {
            return res.status(400).json({
                status: "error",
                message: `An active renewal application for '${sourceApplication.category}' already exists. Please complete or cancel the existing one before starting a new renewal.`
            });
        }

        // Clone the application data
        const applicationObj = sourceApplication.toObject();

        // Remove identifier fields
        delete applicationObj._id;
        delete applicationObj.createdAt;
        delete applicationObj.updatedAt;
        delete applicationObj.__v;

        // Generate new application number
        const timestamp = Date.now().toString().slice(-8);
        const prefix = sourceApplication.applicationNumber?.split('-')[0] || "REN";
        const newApplicationNumber = `${prefix}-REN-${timestamp}`;

        // Set renewal specific fields
        const renewalApplicationData = {
            ...applicationObj,
            applicationNumber: newApplicationNumber,
            category: "Renewal Application",
            status: "Submitted",
            type: "Renewal",
            requestedDate: new Date(),
            processStep: 1,
            processData: {}
        };

        const newApplication = new applicationModel(renewalApplicationData);
        await newApplication.save();

        res.status(201).json({
            status: "success",
            message: "New renewal application created successfully",
            application: newApplication
        });
    } catch (error) {
        console.error("Renewal Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update application process step
const updateProcessStep = [processUpload.fields([{ name: 'file', maxCount: 10 }, { name: 'label', maxCount: 10 }, { name: 'prepDoc', maxCount: 3 }, { name: 'ncRejectFile', maxCount: 20 }]), async (req, res) => {
    const { id } = req.params;
    const { step, subStep, data } = req.body;
    const stepNum = parseInt(step);

    try {
        const application = await applicationModel.findById(id);
        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (!application.processData) application.processData = {};
        if (!application.processData.audit) application.processData.audit = {};

        let filePath = null;

        const sendNotification = async (title, message, showAsModal = false, actionType = null, actionData = null) => {
            try {
                const company = await userModel.findOne({ registrationNo: application.companyId });
                if (company) {
                    const notification = new notificationModel({
                        title,
                        message,
                        forAdmin: false,
                        type: 'application',
                        companyId: company._id,
                        showAsModal,
                        actionType: actionType || undefined,
                        actionData: actionData || undefined
                    });
                    await notification.save();
                }
            } catch (err) {
                console.error('Failed to create notification', err);
            }
        };

        const filePaths = [];
        const fileIds = [];
        if (req.files && req.files['file'] && req.files['file'].length > 0) {
            for (const fileObj of req.files['file']) {
                const uploaded = await uploadFileToGridFS(req, fileObj, id, stepNum, subStep, true);
                filePaths.push(uploaded.path);
                fileIds.push(uploaded.id);
            }
        }
        filePath = filePaths[0]; // For backward compatibility in some cases

        const labelPaths = [];
        const labelIds = [];
        if (req.files && req.files['label'] && req.files['label'].length > 0) {
            for (const fileObj of req.files['label']) {
                const uploaded = await uploadFileToGridFS(req, fileObj, id, stepNum, subStep, true);
                labelPaths.push(uploaded.path);
                labelIds.push(uploaded.id);
            }
        }

        const prepDocPaths = [];
        const prepDocIds = [];
        if (req.files && req.files['prepDoc'] && req.files['prepDoc'].length > 0) {
            for (const fileObj of req.files['prepDoc']) {
                const uploaded = await uploadFileToGridFS(req, fileObj, id, stepNum, subStep, true);
                prepDocPaths.push({ name: fileObj.originalname, url: uploaded.path });
                prepDocIds.push(uploaded.id);
            }
        }

        switch (stepNum) {
            case 2:
                // Accept Application
                application.status = 'Accepted';
                application.processData.acceptedAt = new Date();
                application.processStep = Math.max(application.processStep, 4);
                await sendNotification('Application Accepted', `Your application (${application.applicationNumber}) has been formally accepted. Next Step: Please await the issuance of your invoice, which will be sent to you shortly.`);

                const companyAccepted = await userModel.findOne({ registrationNo: application.companyId });
                if (companyAccepted) {
                    const recipients = await getCompanyRecipients(application.companyId, companyAccepted);
                    if (recipients.length > 0) {
                        applicationAcceptedEmail(
                            recipients,
                            companyAccepted.companyName || companyAccepted.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send Application Accepted email to client:', err));
                    }
                }
                break;
            case 3:
                // Product Approval Forms Received
                application.status = 'Product Forms Received';
                application.processData.productFormsReceivedAt = new Date();
                application.processStep = Math.max(application.processStep, 4);
                await sendNotification('Forms Received', `Product approval forms for application (${application.applicationNumber}) have been received. Next Step: Please await your invoice.`);

                const companyForms = await userModel.findOne({ registrationNo: application.companyId });
                if (companyForms) {
                    const recipients = await getCompanyRecipients(application.companyId, companyForms);
                    if (recipients.length > 0) {
                        sendTrackingUpdateEmail(
                            recipients,
                            companyForms.companyName || companyForms.fullName || 'Valued Client',
                            application.applicationNumber,
                            'Product Approval Forms Received',
                            'Your product approval forms have been successfully received by our team. Please await your invoice which will be issued shortly.'
                        ).catch(err => console.error('Failed to send Product Forms email to client:', err));
                    }
                }
                break;
            case 4:
                // Invoice Sent - upload invoice file
                application.status = 'Invoice Sent';
                if (filePath) {
                    application.processData.invoiceFile = filePath;

                    // Automatically create/update Invoice document
                    const company = await userModel.findOne({ registrationNo: application.companyId });
                    if (company) {
                        let invoice = await invoiceModel.findOne({ applicationId: id });
                        if (!invoice) {
                            const timestamp = Date.now().toString().slice(-6);
                            invoice = new invoiceModel({
                                invoiceNumber: `INV-${timestamp}`,
                                applicationId: id,
                                userId: company._id,
                                amount: 0,
                                status: 'Issued',
                                description: `Application ${application.applicationNumber} - Halal Certification`,
                                issuedAt: new Date(),
                                invoiceFile: filePath
                            });
                        } else {
                            invoice.invoiceFile = filePath;
                            invoice.status = 'Issued';
                            invoice.issuedAt = new Date();
                        }
                        await invoice.save();
                    }
                }
                application.processData.invoiceSentAt = new Date();
                application.processStep = Math.max(application.processStep, 5);
                await sendNotification('Invoice Sent', `An invoice has been sent for your application (${application.applicationNumber}). Next Step: Please log into the portal to view the invoice and upload your proof of payment.`, true, 'view_invoice', { applicationId: id });

                const companyInvoice = await userModel.findOne({ registrationNo: application.companyId });
                if (companyInvoice) {
                    const invoiceDoc = await invoiceModel.findOne({ applicationId: id });
                    const recipients = await getCompanyRecipients(application.companyId, companyInvoice);
                    if (recipients.length > 0) {
                        invoiceIssuedEmail(
                            recipients,
                            companyInvoice.companyName || companyInvoice.fullName || 'Valued Client',
                            application.applicationNumber,
                            invoiceDoc?.invoiceNumber || application.applicationNumber,
                            invoiceDoc?.amount ? `₦${invoiceDoc.amount.toLocaleString()}` : 'See attached invoice'
                        ).catch(err => console.error('Failed to send Invoice Issued email to client:', err));
                    }
                }
                break;
            case 5:
                // Payment Received — also mark invoice as Proof of Payment Approved
                application.status = 'Payment Received';
                application.processData.paymentConfirmedAt = new Date();
                application.processStep = Math.max(application.processStep, 6);

                // Update linked invoice status
                await invoiceModel.findOneAndUpdate(
                    { applicationId: id },
                    { status: 'Proof of Payment Approved', paidAt: new Date() }
                );
                await sendNotification('Payment Received', `Your payment for application (${application.applicationNumber}) has been confirmed. Next Step: We will be proposing audit dates soon. Please check your dashboard to review and approve them.`);

                const companyPayment = await userModel.findOne({ registrationNo: application.companyId });
                if (companyPayment) {
                    const recipients = await getCompanyRecipients(application.companyId, companyPayment);
                    if (recipients.length > 0) {
                        paymentReceivedEmail(
                            recipients,
                            companyPayment.companyName || companyPayment.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send Payment Received email to client:', err));
                    }
                }
                break;
            case 6: {
                // Audit sub-steps — all changes sync to the real audit collection
                application.status = 'Audit Session';
                const subStepNum = parseInt(subStep) || 1;

                if (subStepNum === 1 && data) {
                    // Sub-step 1: Conclude Date & Schedule Audit
                    let auditInfo;
                    try { auditInfo = JSON.parse(data); } catch { auditInfo = {}; }

                    const company = await userModel.findOne({ registrationNo: application.companyId });
                    if (!company) throw new Error('Company not found for this application');

                    let audit = await auditModel.findOne({ applicationId: id, status: { $ne: 'Completed' } });

                    if (auditInfo.action === 'propose') {
                        // Phase 1: Propose 2 audit periods (date + fromTime + toDate)
                        const pDates = auditInfo.proposedDates || [];
                        if (pDates.length !== 2) {
                            throw new Error('Please propose exactly 2 date options');
                        }
                        for (let i = 0; i < pDates.length; i++) {
                            const pd = pDates[i];
                            if (!pd.date) throw new Error(`Date is required for option ${i + 1}`);
                            if (!pd.fromTime) throw new Error(`Time is required for option ${i + 1}`);
                            pd.toDate = pd.toDate || pd.date;
                            pDates[i].time = pd.fromTime; // backward compat
                        }

                        if (!audit) {
                            audit = new auditModel({
                                applicationId: id,
                                userId: company._id,
                                branchId: application.branchId,
                                proposedDates: pDates,
                                status: 'Proposed'
                            });
                        } else {
                            audit.proposedDates = pDates;
                            audit.status = 'Proposed';
                            audit.rejectReason = undefined;
                            audit.scheduledDate = undefined;
                            audit.scheduledTime = undefined;
                        }
                        await audit.save();

                        // Mirror to processData
                        application.processData.audit.proposedDates = pDates;
                        application.processData.audit.status = 'Proposed';
                        application.processData.audit.auditId = audit._id.toString();
                        application.processData.audit.auditRejected = false;
                        application.processData.audit.rejectReason = undefined;
                        application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 1);

                        await sendNotification('Audit Dates Proposed', `2 audit date options have been proposed for your application (${application.applicationNumber}). Next Step: Please log in to select your preferred date or propose alternative dates.`, true, 'respond_audit_schedule', { auditId: audit._id.toString() });

                        getCompanyRecipients(application.companyId, company).then(recipients => {
                            if (recipients.length > 0) {
                                auditDatesProposedEmail(
                                    recipients,
                                    company.companyName || company.fullName || 'Valued Client',
                                    application.applicationNumber
                                ).catch(err => console.error('Failed to send audit dates proposed email:', err));
                            }
                        }).catch(err => console.error('Failed to resolve recipients:', err));

                    } else if (auditInfo.action === 'finalizeDate') {
                        // Phase 2: Admin finalizes one of the options (counter-proposals or choice)
                        if (!audit) throw new Error('No audit record found');
                        if (!auditInfo.date || !auditInfo.time) throw new Error('Date and time are required to finalize');

                        audit.scheduledDate = new Date(auditInfo.date);
                        audit.scheduledTime = auditInfo.time;
                        if (auditInfo.toDate) audit.scheduledToDate = new Date(auditInfo.toDate);
                        audit.status = 'Date Concluded';
                        await audit.save();

                        application.processData.audit.scheduledDate = new Date(auditInfo.date);
                        application.processData.audit.scheduledTime = auditInfo.time;
                        if (auditInfo.toDate) application.processData.audit.scheduledToDate = new Date(auditInfo.toDate);
                        application.processData.audit.status = 'Date Concluded';
                        application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 1);

                        await sendNotification('Audit Date Concluded', `Audit date has been finalized as ${new Date(auditInfo.date).toLocaleDateString()} at ${auditInfo.time}. Next Step: Prepare your facility for the upcoming audit session.`, true, 'view_audit', { auditId: audit._id.toString() });

                    } else {
                        throw new Error('Invalid schedule action. Use "propose" or "finalizeDate".');
                    }

                } else if (subStepNum === 2) {
                    // Sub-step 2: Assign Auditors to concluded date
                    let auditInfo;
                    try { auditInfo = JSON.parse(data); } catch { auditInfo = {}; }

                    const auditorsList = auditInfo.auditors || [];
                    if (auditorsList.length === 0) {
                        throw new Error('At least one auditor must be assigned');
                    }
                    const hasLeadAuditor = auditorsList.some(aud => aud.role === 'Lead Auditor');
                    if (!hasLeadAuditor) {
                        throw new Error('At least one Lead Auditor must be assigned');
                    }
                    const leadAuditor = auditorsList.find(aud => aud.role === 'Lead Auditor') || auditorsList[0];

                    let audit2 = await auditModel.findOne({ applicationId: id, status: { $ne: 'Completed' } });
                    if (!audit2) throw new Error('No audit record found. Please schedule dates first.');

                    audit2.staffName = leadAuditor.name || 'TBD';
                    audit2.auditorEmail = leadAuditor.email || '';
                    audit2.auditorPhone = leadAuditor.phone || '';
                    audit2.auditors = auditorsList;
                    audit2.status = 'Scheduled';
                    if (prepDocPaths.length > 0) {
                        audit2.prepDocuments = prepDocPaths;
                    }
                    await audit2.save();

                    application.processData.audit.auditors = auditorsList;
                    application.processData.audit.leadAuditorName = leadAuditor.name || '';
                    application.processData.audit.leadAuditorEmail = leadAuditor.email || '';
                    application.processData.audit.leadAuditorPhone = leadAuditor.phone || '';
                    application.processData.audit.status = 'Scheduled';
                    application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 2);

                    if (prepDocPaths.length > 0) {
                        application.processData.audit.prepDocuments = prepDocPaths;
                    }

                    // Fetch company for notification emails
                    const company2 = await userModel.findOne({ registrationNo: application.companyId });
                    const formattedDate2 = audit2.scheduledDate
                        ? new Date(audit2.scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                        : 'TBD';
                    for (const auditor of auditorsList) {
                        if (auditor.email) {
                            sendAuditScheduledEmail(
                                auditor.email,
                                auditor.name || 'Auditor',
                                auditor.role || 'Auditor',
                                company2?.companyName || company2?.fullName || 'The company',
                                application.applicationNumber,
                                formattedDate2,
                                audit2.scheduledTime || ''
                            ).catch(err => console.error(`Failed to send audit email to ${auditor.email}:`, err));
                        }
                    }
                    await sendNotification('Auditors Assigned', `Auditors have been assigned for your audit session (${application.applicationNumber}). We have also attached preparation documents. Next Step: You will be contacted by the auditors shortly. Please log in to view and download the preparation documents to get your facility ready.`, true, 'view_audit', { auditId: audit2._id.toString() });

                    if (company2) {
                        const recipients2 = await getCompanyRecipients(application.companyId, company2);
                        if (recipients2.length > 0) {
                            auditorsAssignedEmail(
                                recipients2,
                                company2.companyName || company2.fullName || 'Valued Client',
                                application.applicationNumber
                            ).catch(err => console.error('Failed to send auditors assigned email to client:', err));
                        }
                    }

                } else if (subStepNum === 3) {
                    // Sub-step 3: Audited — mark audit as Accepted/Completed
                    const auditId = application.processData?.audit?.auditId;
                    if (auditId) {
                        await auditModel.findByIdAndUpdate(auditId, { status: 'Audited' });
                    }
                    application.processData.audit.auditedAt = new Date();
                    application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 3);
                    application.processStep = Math.max(application.processStep, 7);
                    await sendNotification('Audited', `Your audit session for application (${application.applicationNumber}) has been marked as concluded. Next Step: Please wait for Non-Conformity (NC) review or Shari'a Logsheet initiation.`, true, 'view_audit', { auditId: application.processData?.audit?.auditId });

                    const company3 = await userModel.findOne({ registrationNo: application.companyId });
                    if (company3) {
                        const recipients3 = await getCompanyRecipients(application.companyId, company3);
                        if (recipients3.length > 0) {
                            auditCompletedEmail(
                                recipients3,
                                company3.companyName || company3.fullName || 'Valued Client',
                                application.applicationNumber
                            ).catch(err => console.error('Failed to send audit completed email to client:', err));
                        }
                    }

                } else if (subStepNum === 4) {
                    // Sub-step 4: NC Report upload — save file to audit record
                    if (filePath) {
                        const auditId = application.processData?.audit?.auditId;
                        if (auditId) {
                            await auditModel.findByIdAndUpdate(auditId, {
                                ncReport: filePath,
                                status: 'NC Flagged'
                            });
                        }
                        application.processData.audit.ncReport = filePath;
                        await sendNotification('NC Report Uploaded', `A Non-Conformity report has been uploaded for your application (${application.applicationNumber}). Next Step: Please log in to download the report and take the necessary corrective actions immediately.`, true, 'upload_nc_correction', { auditId: application.processData?.audit?.auditId });

                        const company4 = await userModel.findOne({ registrationNo: application.companyId });
                        if (company4) {
                            const ncReportUrl = filePath ? `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}${filePath}` : null;
                            const recipients4 = await getCompanyRecipients(application.companyId, company4);
                            if (recipients4.length > 0) {
                                ncFlaggedEmail(
                                    recipients4,
                                    company4.companyName || company4.fullName || 'Valued Client',
                                    application.applicationNumber,
                                    ncReportUrl
                                ).catch(err => console.error('Failed to send NC Flagged email to client:', err));
                            }
                        }
                    }
                    application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 4);

                } else if (subStepNum === 5) {
                    // Sub-step 5: NC Report Closed — resolve all corrections or reject them
                    let stepData;
                    try { stepData = JSON.parse(data); } catch { stepData = {}; }

                    const auditId = application.processData?.audit?.auditId;

                    if (stepData.action === 'rejectNc') {
                        // Upload any attached rejection documents to GridFS
                        const rejectFileUrls = [];
                        const rejectionFiles = (req.files && req.files['ncRejectFile']) || [];
                        for (const fileObj of rejectionFiles) {
                            const bucket = getGridFSBucket('auditReports');
                            const filename = `nc-reject-doc-${Date.now()}-${fileObj.originalname}`;
                            const uploadStream = bucket.openUploadStream(filename, {
                                contentType: fileObj.mimetype,
                                metadata: { applicationId: id, type: 'ncRejectFile' }
                            });
                            const bufferStream = new Readable();
                            bufferStream.push(fileObj.buffer);
                            bufferStream.push(null);
                            await new Promise((resolve, reject) => {
                                bufferStream.pipe(uploadStream).on('error', reject).on('finish', resolve);
                            });
                            rejectFileUrls.push(`/api/files/${uploadStream.id}`);
                        }

                        if (auditId) {
                            const auditDoc = await auditModel.findById(auditId);
                            if (auditDoc) {
                                auditDoc.ncRejectReason = stepData.rejectReason;
                                auditDoc.ncRejectFiles = rejectFileUrls;
                                auditDoc.ncCorrectionFile = [];
                                await auditDoc.save();
                            }
                        }
                        application.processData.audit.ncRejectReason = stepData.rejectReason;
                        application.processData.audit.ncRejectFiles = rejectFileUrls;
                        application.processData.audit.ncCorrectionFile = [];

                        await sendNotification('NC Corrections Rejected', `Your NC corrections for application (${application.applicationNumber}) were rejected. Reason: ${stepData.rejectReason}. Next Step: Please review the feedback and re-upload your corrections.`, true, 'upload_nc_correction', { auditId: auditId });

                        const companyReject = await userModel.findOne({ registrationNo: application.companyId });
                        if (companyReject) {
                            const recipientsReject = await getCompanyRecipients(application.companyId, companyReject);
                            if (recipientsReject.length > 0) {
                                ncRejectedEmail(
                                    recipientsReject,
                                    companyReject.companyName || companyReject.fullName || 'Valued Client',
                                    application.applicationNumber,
                                    stepData.rejectReason
                                ).catch(err => console.error('Failed to send NC Rejected email to client:', err));
                            }
                        }
                    } else {
                        if (auditId) {
                            const auditDoc = await auditModel.findById(auditId);
                            if (auditDoc) {
                                auditDoc.corrections.forEach(c => {
                                    c.status = 'Resolved';
                                    c.resolvedAt = new Date();
                                });
                                auditDoc.status = 'Accepted';
                                await auditDoc.save();
                            }
                        }
                        application.status = 'NC Closed';
                        application.processData.audit.ncClosedAt = new Date();
                        application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 5);
                        application.processStep = Math.max(application.processStep, 7);
                        await sendNotification('Corrections Resolved', `All NC corrections for your application (${application.applicationNumber}) have been verified as closed. Next Step: Your application will proceed to Shari'a Logsheet initiation.`, true, 'view_audit', { auditId: auditId });

                        const company5 = await userModel.findOne({ registrationNo: application.companyId });
                        if (company5) {
                            const recipients5 = await getCompanyRecipients(application.companyId, company5);
                            if (recipients5.length > 0) {
                                ncClosedEmail(
                                    recipients5,
                                    company5.companyName || company5.fullName || 'Valued Client',
                                    application.applicationNumber
                                ).catch(err => console.error('Failed to send NC Closed email to client:', err));
                            }
                        }
                    }
                } else if (subStepNum === 6) {
                    // Sub-step 6: Audit Report uploaded — ONLY by admin
                    if (req.user.role !== 'admin' && req.user.role !== 'super admin') {
                        return res.status(403).json({ message: 'Unauthorized. Only administrators can upload audit reports.' });
                    }
                    if (filePath) {
                        const auditId = application.processData?.audit?.auditId;
                        if (auditId) {
                            await auditModel.findByIdAndUpdate(auditId, {
                                auditReport: filePath,
                                reportUploadedAt: new Date(),
                            });
                        }
                        application.processData.audit.auditReportFile = filePath;
                        await sendNotification('Audit Report Uploaded', `The final audit report for application (${application.applicationNumber}) is now available. Next Step: The admin will review and complete the audit phase.`);
                    }
                    application.status = 'Audited';
                    application.processData.audit.auditReportSubmittedAt = new Date();
                    application.processData.audit.subStep = Math.max(application.processData.audit.subStep || 0, 6);

                    // Mark audit phase as completed (formerly subStep 7)
                    const auditIdForComplete = application.processData?.audit?.auditId;
                    if (auditIdForComplete) {
                        await auditModel.findByIdAndUpdate(auditIdForComplete, {
                            status: 'Audited',
                            completedAt: new Date()
                        });
                    }
                    application.processStep = Math.max(application.processStep, 7);
                    await sendNotification('Audit Phase Completed', `The audit phase for application (${application.applicationNumber}) holds finalized completion status. Next Step: Your application will now be forwarded to the Shari'a Board for review.`, true, 'view_audit', { auditId: application.processData?.audit?.auditId });

                    const companyReport = await userModel.findOne({ registrationNo: application.companyId });
                    if (companyReport) {
                        const reportUrl = filePath ? `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}${filePath}` : null;
                        const recipientsReport = await getCompanyRecipients(application.companyId, companyReport);
                        if (recipientsReport.length > 0) {
                            finalAuditReportUploadedEmail(
                                recipientsReport,
                                companyReport.companyName || companyReport.fullName || 'Valued Client',
                                application.applicationNumber,
                                reportUrl
                            ).catch(err => console.error('Failed to send Final Audit Report Uploaded email to client:', err));
                        }
                    }
                }
                break;
            }
            case 7:
                // Sent to Shari'a Board
                application.status = "With Shari'a Board";
                application.processData.shariaBoardSentAt = new Date();
                application.processStep = Math.max(application.processStep, 8);
                await sendNotification("Shari'a Board Review", `Your application (${application.applicationNumber}) has been sent to the Shari'a Board for final endorsement. Next Step: Await the final decision from the Shari'a Board.`);
                
                const companySharia = await userModel.findOne({ registrationNo: application.companyId });
                if (companySharia) {
                    const recipientsSharia = await getCompanyRecipients(application.companyId, companySharia);
                    if (recipientsSharia.length > 0) {
                        sentToShariaBoardEmail(
                            recipientsSharia,
                            companySharia.companyName || companySharia.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send Sharia Board email to client:', err));
                    }
                }
                break;
            case 8:
                // Application Successful
                application.status = "Shari'a Board Review";
                application.processData.certificationApprovedAt = new Date();
                application.processStep = Math.max(application.processStep, 9);
                await sendNotification('Application Successful', `Your application (${application.applicationNumber}) is successful for certification. It has been pushed to the final stages. Next Step: Your certificate is now being processed.`);

                const companySuccess = await userModel.findOne({ registrationNo: application.companyId });
                if (companySuccess) {
                    const recipientsSuccess = await getCompanyRecipients(application.companyId, companySuccess);
                    if (recipientsSuccess.length > 0) {
                        applicationSuccessfulEmail(
                            recipientsSuccess,
                            companySuccess.companyName || companySuccess.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send Application Successful email to client:', err));
                    }
                }
                break;
            case 9:
                // Certificate Processing
                application.status = "Application Successful";
                application.processData.processingStartedAt = new Date();
                application.processStep = Math.max(application.processStep, 10);
                await sendNotification('Certificate Processing', `Certificate processing has started for application (${application.applicationNumber}). Next Step: Your official Halal Certificate will be issued soon.`);

                const companyProcessing = await userModel.findOne({ registrationNo: application.companyId });
                if (companyProcessing) {
                    const recipientsProcessing = await getCompanyRecipients(application.companyId, companyProcessing);
                    if (recipientsProcessing.length > 0) {
                        sendTrackingUpdateEmail(
                            recipientsProcessing,
                            companyProcessing.companyName || companyProcessing.fullName || 'Valued Client',
                            application.applicationNumber,
                            'Certificate Processing',
                            'Certificate processing has started for your application. Your official Halal Certificate will be issued soon. You will receive a notification once it is ready.'
                        ).catch(err => console.error('Failed to send Certificate Processing email to client:', err));
                    }
                }
                break;
            case 10: {
                // Issue Certificate Manual
                const { certNumber, expiryDate } = req.body;

                if (filePaths.length === 0 && (!application.processData.certificateFiles || application.processData.certificateFiles.length === 0)) {
                    return res.status(400).json({ message: 'At least one certificate file is required.' });
                }

                const finalCertNumber = certNumber || application.applicationNumber;
                const finalFiles = filePaths.length > 0 ? filePaths : (application.processData.certificateFiles || []);
                const finalFileIds = fileIds.length > 0 ? fileIds : (application.processData.certificateFileIds || []);
                const finalLabels = labelPaths.length > 0 ? labelPaths : (application.processData.labelFiles || []);
                const finalLabelIds = labelIds.length > 0 ? labelIds : (application.processData.labelFileIds || []);

                // Create a certificate record
                const products = await productModel.find({ applicationId: id });

                const certificate = new certificateModel({
                    certificateNumber: finalCertNumber,
                    certificateType: application.category,
                    standard: 'ISO 22000:2018', // Default standard
                    status: 'Active',
                    product: products.map(p => p.name),
                    issueDate: new Date(),
                    expiryDate: expiryDate ? new Date(expiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    applicationId: id,
                    companyId: application.companyId,
                    branchId: application.branchId,
                    pdfFileIds: finalFileIds,
                    pdfPaths: finalFiles,
                    labelPaths: finalLabels,
                    labelFileIds: finalLabelIds,
                    generatedBy: "Admin (Manual)"
                });

                await certificate.save();

                // Mark all associated products as approved
                await productModel.updateMany(
                    { applicationId: id },
                    { $set: { status: 'approved' } }
                );

                // --- Retire the old (renewed) certificate ---
                // When this application is a renewal, mark the source certificate as Inactive
                // so it no longer appears in the client's renewable certificates list.
                try {
                    if (application.renewedCertificateId) {
                        // Direct link to the specific old certificate
                        await certificateModel.findByIdAndUpdate(
                            application.renewedCertificateId,
                            { $set: { status: 'Inactive' } }
                        );
                    } else if (application.renewedApplicationId) {
                        // Find the certificate associated with the source application
                        await certificateModel.updateMany(
                            { applicationId: application.renewedApplicationId },
                            { $set: { status: 'Inactive' } }
                        );
                    } else if (application.category === 'Renewal Application') {
                        // Fallback: retire any Expired or Expiring Soon certs on this branch
                        await certificateModel.updateMany(
                            {
                                companyId: application.companyId,
                                branchId: application.branchId,
                                status: { $in: ['Expired', 'Expiring Soon', 'Active'] },
                                _id: { $ne: certificate._id }
                            },
                            { $set: { status: 'Inactive' } }
                        );
                    }
                } catch (retireErr) {
                    console.error('Failed to retire old certificate on renewal issuance:', retireErr);
                }

                application.processData.certificateFiles = finalFiles;
                application.processData.certificateFileIds = finalFileIds;
                application.processData.certificateNumber = finalCertNumber;
                application.processData.certificateExpiryDate = expiryDate;
                application.processData.labelFiles = finalLabels;
                application.processData.labelFileIds = finalLabelIds;
                application.processData.issuedAt = new Date();
                application.status = 'Issued';
                application.processStep = 10;
                await sendNotification('Certificate Issued', `Congratulations! Your Halal Certificate (${finalCertNumber}) has been successfully issued. Next Step: Log into your dashboard to view and download your certificate and Halal Logo.`);

                const companyIssued = await userModel.findOne({ registrationNo: application.companyId });
                if (companyIssued) {
                    const recipientsIssued = await getCompanyRecipients(application.companyId, companyIssued);
                    if (recipientsIssued.length > 0) {
                        certificateIssuedEmail(
                            recipientsIssued,
                            companyIssued.companyName || companyIssued.fullName || 'Valued Client',
                            application.applicationNumber
                        ).catch(err => console.error('Failed to send Certificate Issued email to client:', err));
                    }
                }
                break;
            }
            default:
                return res.status(400).json({ message: 'Invalid step number' });
        }

        application.markModified('processData');
        await application.save();
        res.json({ status: 'success', application });
    } catch (error) {
        console.error('Process step error:', error);
        res.status(500).json({ message: error.message });
    }
}];

module.exports = {
    getApplications,
    getApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    getRenewalApplications,
    searchApplications,
    rejectApplication,
    acceptApplication,
    renewApplication,
    updateProcessStep,
    processUpload
};
