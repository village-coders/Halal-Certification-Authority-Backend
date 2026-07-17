const invoiceModel = require('../Models/invoice');
const applicationModel = require('../Models/application');
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');
const { uploadToHybridStorage } = require('../Utils/fileUpload');
const proofOfPaymentUploadedEmail = require('../Services/Nodemailer/proofOfPaymentUploadedEmail');
const userModel = require('../Models/user');
const notificationModel = require('../Models/notification');

// Admin Create an invoice for a client
const adminCreateInvoice = async (req, res) => {
    const { userId, applicationId, amount, description } = req.body;

    try {
        if (!userId) {
            return res.status(400).json({ message: 'User (Client) ID is required to create an invoice' });
        }

        const timestamp = Date.now().toString().slice(-6);
        const invoiceNumber = `INV-${timestamp}`;

        let invoiceFile = undefined;
        if (req.file) {
            const uploadResult = await uploadToHybridStorage(
                req.file, 
                'invoices', 
                'invoiceFiles', 
                { userId, invoiceNumber }
            );
            
            if (uploadResult.fileUrl.startsWith('/api/files/')) {
                invoiceFile = `${req.protocol}://${req.get('host')}${uploadResult.fileUrl}`;
            } else {
                invoiceFile = uploadResult.fileUrl;
            }
        }

        let branchId = undefined;
        if (applicationId) {
            const application = await applicationModel.findById(applicationId);
            if (application) {
                branchId = application.branchId;
            }
        }

        const invoice = new invoiceModel({
            invoiceNumber,
            applicationId: applicationId || undefined,
            userId,
            branchId,
            amount: 0,
            status: 'Issued',
            description,
            invoiceFile,
            issuedAt: new Date()
        });

        await invoice.save();

        // Notify the user that an invoice has been issued
        try {
            const notification = new notificationModel({
                title: 'New Invoice Issued',
                message: `A new invoice (${invoiceNumber}) has been issued for you. Please log in to view and pay.`,
                forAdmin: false,
                type: 'invoice',
                companyId: userId,
                showAsModal: true,
                actionType: 'view_invoice',
                actionData: { invoiceId: invoice._id.toString() }
            });
            await notification.save();
        } catch (notifErr) {
            console.error('Failed to create invoice notification:', notifErr);
        }


        res.status(201).json({ message: "Invoice created successfully", invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Issue an invoice (Legacy Admin update amount method)
const issueInvoice = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;

    try {
        const invoice = await invoiceModel.findById(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        invoice.amount = amount;
        invoice.status = 'Issued';
        invoice.issuedAt = new Date();

        await invoice.save();
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Pay an invoice (User)
const payInvoice = async (req, res) => {
    const { id } = req.params;
    const { paymentId } = req.body; // In real app, verify this with Stripe/Paystack

    try {
        const invoice = await invoiceModel.findById(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'Issued') {
            return res.status(400).json({ message: 'Invoice must be issued before payment' });
        }

        invoice.status = 'Paid';
        invoice.paymentId = paymentId;
        invoice.paidAt = new Date();

        await invoice.save();

        // Optionally update application status or a flag here if needed
        // const application = await applicationModel.findById(invoice.applicationId);
        // application.isPaid = true;
        // await application.save();

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get invoices
const getInvoices = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin' && req.user.role !== 'super admin') {
            filter.userId = req.user.id;
        }

        const invoices = await invoiceModel.find(filter)
            .populate('applicationId', 'applicationNumber category')
            .populate('userId', 'companyName fullName email')
            .populate('branchId', 'branchName address city state')
            .sort({ createdAt: -1 });

        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getInvoiceById = async (req, res) => {
    try {
        const invoice = await invoiceModel.findById(req.params.id)
            .populate('applicationId')
            .populate('userId');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // Ownership check
        if (req.user.role !== 'admin' && req.user.role !== 'super admin' && invoice.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Upload proof of payment (User)
const uploadProofOfPayment = async (req, res) => {
    const { id } = req.params;

    try {
        const invoice = await invoiceModel.findById(id).populate('userId');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a proof of payment' });
        }

        // Save to GridFS
        const bucket = getGridFSBucket('proofOfPayments');
        const filename = `proof-of-payment-${Date.now()}-${req.file.originalname}`;
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                invoiceId: id,
                invoiceNumber: invoice.invoiceNumber,
                companyName: invoice.userId?.companyName || 'Unknown'
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
        
        invoice.status = 'Processing';
        invoice.paymentType = 'Offline';
        invoice.proofOfPayment = `${req.protocol}://${req.get('host')}/api/files/${fileId}`;

        await invoice.save();

        const proofUrl = invoice.proofOfPayment;
        const companyName = invoice.userId?.companyName || invoice.userId?.fullName || 'Client';
        
        // Fetch ALL admins and super admins
        try {
            const notifyAdmins = await userModel.find({
                role: { $in: ['admin', 'super admin'] }
            }).select('email');
            const adminEmails = notifyAdmins.map(admin => admin.email).filter(Boolean);
            
            if (adminEmails.length > 0) {
                proofOfPaymentUploadedEmail(
                    adminEmails,
                    companyName,
                    invoice.invoiceNumber,
                    proofUrl
                ).catch(err => console.error("Error sending proof of payment email:", err));
            }
        } catch (err) {
            console.error("Error fetching admins for email notification:", err);
        }

        res.json({ message: 'Proof of payment uploaded and status updated', invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve payment (Admin)
const approvePayment = async (req, res) => {
    const { id } = req.params;

    try {
        const invoice = await invoiceModel.findById(id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status !== 'Processing') {
            return res.status(400).json({ message: 'Invoice is not waiting for approval' });
        }

        invoice.status = 'Paid';
        invoice.paidAt = new Date();

        await invoice.save();

        res.json({ message: 'Payment approved and status updated to Paid', invoice });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    adminCreateInvoice,
    issueInvoice,
    payInvoice,
    uploadProofOfPayment,
    approvePayment,
    getInvoices,
    getInvoiceById
};
