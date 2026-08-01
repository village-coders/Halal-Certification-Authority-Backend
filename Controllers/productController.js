const productModel = require("../Models/product");
const userModel = require("../Models/user");
const applicationModel = require("../Models/application");
const sendProductApprovalEmail = require("../Services/Nodemailer/productApprovalEmail");
const sendProductInvoiceEmail = require("../Services/Nodemailer/productInvoicePaidEmail");
const sendTrackingUpdateEmail = require("../Services/Nodemailer/trackingUpdateEmail");
const notificationModel = require('../Models/notification');
const getCompanyMemberEmails = require('../Utils/getCompanyMemberEmails');
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');

const createProduct = async (req, res, next) => {
    try {
        const { products, applicationId, note } = req.body;

        let parsedProducts = [];
        try {
            parsedProducts = typeof products === 'string' ? JSON.parse(products) : products;
        } catch (err) {
            parsedProducts = [products];
        }

        if (!Array.isArray(parsedProducts)) {
            parsedProducts = [parsedProducts];
        }

        const userId = req.user.id;
        // Always use parent company so sub-users' products are stored under the main company
        const companyOwnerId = req.companyOwnerId || userId;
        const company = await userModel.findById(companyOwnerId);
        const application = await applicationModel.findById(applicationId);

        if (!application) {
            return res.status(404).json({
                status: "error",
                message: "Application is required"
            });
        }

        if (application.status !== "Accepted" && application.status !== "Approved") {
            return res.status(400).json({
                status: "error",
                message: "Application is not accepted yet. Contact the administrator."
            });
        }

        const branchId = application.branchId;

        // Function to upload a file to GridFS and return its URL
        const uploadToGridFS = async (file, productIndex, docNumber) => {
            if (!file) return null;

            const bucket = getGridFSBucket('productDocs');
            const filename = `product-${userId}-${Date.now()}-${file.originalname}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: file.mimetype,
                metadata: {
                    userId,
                    applicationId,
                    productIndex,
                    docNumber
                }
            });

            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);

            await new Promise((resolve, reject) => {
                bufferStream.pipe(uploadStream)
                    .on('error', reject)
                    .on('finish', resolve);
            });

            return {
                fileUrl: `${req.protocol}://${req.get('host')}/api/files/${uploadStream.id}`,
                publicId: uploadStream.id.toString()
            };
        };

        // Construct products array mapping files to their specific product index
        const productsToInsert = [];

        for (let i = 0; i < parsedProducts.length; i++) {
            const p = parsedProducts[i];

            const getFile = (docNumber) => {
                if (!req.files || !Array.isArray(req.files)) return null;
                return req.files.find(f => f.fieldname === `document${docNumber}_${i}`);
            };

            const doc1File = getFile(1);
            const doc2File = getFile(2);
            const doc3File = getFile(3);

            const document1 = await uploadToGridFS(doc1File, i, 1);
            const document2 = await uploadToGridFS(doc2File, i, 2);
            const document3 = await uploadToGridFS(doc3File, i, 3);

            productsToInsert.push({
                name: p.name || p,
                applicationId: applicationId,
                branchId: branchId,
                note: note || "",
                companyId: company.registrationNo,
                createdBy: userId,
                document1,
                document2,
                document3
            });
        }

        const insertedProducts = await productModel.insertMany(productsToInsert);

        try {
            const notification = new notificationModel({
                title: 'New Products',
                message: `${company.companyName || company.fullName} added ${productsToInsert.length} new product(s)`,
                companyId: company._id  // parent company _id
            });
            await notification.save();
        } catch (err) {
            console.error('Failed to create notification', err);
        }

        res.status(200).json({
            status: "success",
            message: `${productsToInsert.length} Product(s) successfully created`,
            products: insertedProducts
        });
    } catch (error) {
        console.error("Create Product Error:", error);
        next(error);
    }
}

const getMyProducts = async (req, res, next) => {
    // Use parent company so sub-users see all company products
    const companyOwnerId = req.companyOwnerId || req.user.id;
    const company = await userModel.findById(companyOwnerId);
    try {
        const products = await productModel.find({ companyId: company.registrationNo }).populate("applicationId").populate("branchId")

        if (!products) {
            return res.status(404).json({
                status: "error",
                message: "You have no product available",
                products: []
            })
        }

        res.status(200).json({
            status: "success",
            message: `Products loaded successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

const getSingleProducts = async (req, res, next) => {
    // const company = await userModel.findById(userId)
    const { id } = req.params
    try {
        const product = await productModel.findById(id).populate("applicationId").populate("branchId").populate("createdBy", "companyId companyName email address phone")

        if (!product) {
            return res.status(404).json({
                status: "success",
                message: "You have no product available",
                product: []
            })
        }

        res.status(200).json({
            status: "success",
            message: `Products loaded successfully`,
            product
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

const getAllProducts = async (req, res, next) => {

    try {
        const query = req.query;
        let build = {}

        // if(req.user.role !== "admin" && company.registrationNo && req.user.role !== "super admin"){
        //     build.companyId = company.registrationNo
        // }

        if (query.status) {
            build.status = query.status
        }

        if (query.applicationId) {
            build.applicationId = query.applicationId
        }

        const products = await productModel.find(build).sort({ createdAt: -1 }).populate("applicationId").populate("branchId").populate("createdBy", "companyId companyName email address phone")

        if (!products) {
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }

        res.status(200).json({
            status: "success",
            message: `Products loaded successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

const approveProduct = async (req, res, next) => {
    const { id } = req.params
    try {

        const products = await productModel.findById(id)

        if (!products) {
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }

        const company = await userModel.findOne({ registrationNo: products.companyId, isUnderCompany: false })
        // console.log(company);

        if (!company) {
            res.status(404).json({
                status: "error",
                message: "No company found"
            })
        }
        company.approvedProducts = (company.approvedProducts || 0) + 1;

        products.status = "acknowledged"

        await products.save()
        await company.save()

        const memberEmails = await getCompanyMemberEmails(company.registrationNo);
        const recipientEmails = memberEmails.length > 0 ? memberEmails : (company.email ? [company.email] : []);
        if (recipientEmails.length > 0) {
            await sendProductApprovalEmail(recipientEmails, company.companyName, products.name);
        }

        try {
            const notification = new notificationModel({
                title: 'Product Acknowledged',
                message: `Your product (${products.name}) has been acknowledged!`,
                forAdmin: false,
                companyId: company._id
            });
            await notification.save();
        } catch (err) {
            console.error(err);
        }

        res.status(200).json({
            status: "success",
            message: `Product acknowledged successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}


const markInvoicePaid = async (req, res, next) => {
    const { id } = req.params
    try {

        const products = await productModel.findById(id)

        if (!products) {
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }

        const company = await userModel.findOne({ registrationNo: products.companyId, isUnderCompany: false })
        // console.log(company);

        if (!company) {
            res.status(404).json({
                status: "error",
                message: "No company found"
            })
        }


        products.invoicePaid = true

        await products.save()

        const memberEmailsPaid = await getCompanyMemberEmails(company.registrationNo);
        const recipientEmailsPaid = memberEmailsPaid.length > 0 ? memberEmailsPaid : (company.email ? [company.email] : []);
        if (recipientEmailsPaid.length > 0) {
            await sendProductInvoiceEmail(recipientEmailsPaid, company.companyName, products.name);
        }

        res.status(200).json({
            status: "success",
            message: `Invoice marked as paid successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}


const rejectProduct = async (req, res, next) => {
    const { id } = req.params
    try {

        const products = await productModel.findById(id)

        if (!products) {
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }

        const company = await userModel.findOne({ registrationNo: products.companyId, isUnderCompany: false })
        console.log(company);

        if (!company) {
            res.status(404).json({
                status: "error",
                message: "No company found"
            })
        }
        company.approvedProducts = (company.approvedProducts || 0) + 1;

        products.status = "rejected"

        await products.save()
        await company.save()

        // Send email notification to all company members
        if (company.email) {
            const memberEmailsReject = await getCompanyMemberEmails(company.registrationNo);
            const recipientEmailsReject = memberEmailsReject.length > 0 ? memberEmailsReject : [company.email];
            sendTrackingUpdateEmail(
                recipientEmailsReject,
                company.companyName || company.fullName || 'Valued Client',
                'N/A', // Application Number might not be available directly on product without populating
                'Product Rejected',
                `Your product (${products.name}) has been rejected. Please review your submission.`
            ).catch(err => console.error('Failed to send tracking email:', err));
        }

        try {
            const notification = new notificationModel({
                title: 'Product Rejected',
                message: `Your product (${products.name}) has been rejected.`,
                forAdmin: false,
                companyId: company._id
            });
            await notification.save();
        } catch (err) {
            console.error(err);
        }

        res.status(200).json({
            status: "success",
            message: `Products rejected successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}



const deleteMyProduct = async (req, res, next) => {
    const productId = req.params.id;
    try {
        const product = await productModel.deleteOne({ _id: productId });
        if (!product) {
            return res.status(404).json({
                status: "error",
                message: "failed to delete your product"
            })
        }

        res.status(200).json({
            status: "success",
            message: "Your product deleted successfully"
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

module.exports = {
    createProduct,
    getMyProducts,
    deleteMyProduct,
    getAllProducts,
    getSingleProducts,
    approveProduct,
    rejectProduct
}