const Document = require("../Models/document");
const User = require("../Models/user");
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');

// 1. Upload a Document
const uploadDocument = async (req, res) => {
    try {
        const { title } = req.body;

        if (!req.file) {
            return res.status(400).json({ status: "error", message: "Please upload a document file." });
        }

        if (!title) {
            return res.status(400).json({ status: "error", message: "Document title is required." });
        }

        // Save to GridFS
        const bucket = getGridFSBucket('documents');
        const filename = `doc-${req.user._id}-${Date.now()}-${req.file.originalname}`;
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: {
                companyId: req.user.registrationNo,
                userId: req.user._id,
                title: title
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

        const newDocument = await Document.create({
            company: req.user._id,
            companyId: req.user.registrationNo,
            title,
            fileUrl: `${req.protocol}://${req.get('host')}/api/files/${uploadStream.id}`,
            publicId: uploadStream.id.toString(),
        });

        res.status(201).json({ status: "success", data: newDocument });
    } catch (error) {
        console.error("Document Upload Error: ", error);
        res.status(500).json({ status: "error", message: "Failed to upload document." });
    }
};

// 2. Get My Documents (For the App / Client)
const getMyDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ company: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", data: documents });
    } catch (error) {
        console.error("Get My Documents Error: ", error);
        res.status(500).json({ status: "error", message: "Failed to retrieve your documents." });
    }
};

// 3. Get All Documents (For the Admin)
const getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .populate("company", "fullName email registrationNo")
            .sort({ createdAt: -1 });
        res.status(200).json({ status: "success", data: documents });
    } catch (error) {
        console.error("Get All Documents Error: ", error);
        res.status(500).json({ status: "error", message: "Failed to retrieve documents." });
    }
};

// 4. Delete Document
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ status: "error", message: "Document not found." });
        }

        // Admins can delete any, users can only delete their own
        if (req.user.role !== "admin" && document.company.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: "error", message: "You are not authorized to delete this document." });
        }

        // Destroy file from GridFS
        if (document.publicId) {
            try {
                const { mongoose } = require('../Config/connectToDb');
                const bucket = getGridFSBucket('documents');
                await bucket.delete(new mongoose.Types.ObjectId(document.publicId));
            } catch (err) {
                console.error("GridFS Delete Error (Non-critical): ", err);
                // Continue even if GridFS delete fails
            }
        }

        await Document.findByIdAndDelete(id);
        res.status(200).json({ status: "success", message: "Document deleted successfully." });
    } catch (error) {
        console.error("Delete Document Error: ", error);
        res.status(500).json({ status: "error", message: "Failed to delete document." });
    }
};

module.exports = {
    uploadDocument,
    getMyDocuments,
    getAllDocuments,
    deleteDocument,
};
