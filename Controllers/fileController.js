const { getGridFSBucket } = require('../Config/connectToDb');
const mongoose = require('mongoose');

const getFile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }

        const buckets = [
            'auditReports',
            'certificatePDFs',
            'messageAttachments',
            'productDocs',
            'documents',
            'profileImages',
            'applicationFiles',
            'proofOfPayments',
            'invoiceFiles',
            'userSignatures'
        ];

        const fileId = new mongoose.Types.ObjectId(id);

        let fileFound = null;
        let activeBucket = null;

        for (const bucketName of buckets) {
            const bucket = getGridFSBucket(bucketName);
            const files = await bucket.find({ _id: fileId }).toArray();
            if (files && files.length > 0) {
                fileFound = files[0];
                activeBucket = bucket;
                break;
            }
        }

        if (!fileFound) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.set('Content-Type', fileFound.contentType || 'application/octet-stream');
        const downloadStream = activeBucket.openDownloadStream(fileId);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
};

const getFileByBucket = async (req, res) => {
    try {
        const { bucket: bucketName, filename } = req.params;
        const bucket = getGridFSBucket(bucketName);
        
        const files = await bucket.find({ filename }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }

        const fileFound = files[0];
        res.set('Content-Type', fileFound.contentType || 'application/octet-stream');
        const downloadStream = bucket.openDownloadStreamByName(filename);
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Error fetching file by bucket:', error);
        res.status(500).json({ message: 'Error fetching file' });
    }
};

module.exports = { getFile, getFileByBucket };
