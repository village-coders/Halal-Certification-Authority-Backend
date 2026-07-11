const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');
const cloudinary = require('../Config/cloudinary');
const mongoose = require('mongoose');

/**
 * Uploads a file to either Cloudinary (if image) or MongoDB GridFS (otherwise).
 * @param {Object} file - The file object from multer (memory storage).
 * @param {string} folder - The Cloudinary folder string.
 * @param {string} bucketName - The GridFS bucket name.
 * @param {Object} metadata - Optional metadata for GridFS.
 * @returns {Promise<{fileUrl: string, publicId: string}>}
 */
const uploadToHybridStorage = async (file, folder, bucketName, metadata = {}) => {
    if (!file) return null;

    const isImage = file.mimetype.startsWith('image/');

    if (isImage) {
        // Upload to Cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: folder },
                (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        fileUrl: result.secure_url,
                        publicId: result.public_id
                    });
                }
            );
            
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    } else {
        // Upload to GridFS
        const bucket = getGridFSBucket(bucketName);
        const filename = `${bucketName.slice(0, 3)}-${Date.now()}-${file.originalname}`;
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: file.mimetype,
            metadata: metadata
        });

        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);

        await new Promise((resolve, reject) => {
            bufferStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        const baseUrl = process.env.BASE_URL || ''; // We might need to construct this or use protocol/host from req
        return {
            fileUrl: `/api/files/${uploadStream.id}`, // Simplified, will need host addition in controller or full URL construction
            publicId: uploadStream.id.toString()
        };
    }
};

const uploadToGridFS = async (file, bucketName, metadata = {}) => {
    if (!file) return null;

    const bucket = getGridFSBucket(bucketName);
    const filename = `${bucketName.slice(0, 3)}-${Date.now()}-${file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: metadata
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
        fileUrl: `/api/files/${uploadStream.id}`,
        publicId: uploadStream.id.toString()
    };
};

module.exports = { uploadToHybridStorage, uploadToGridFS };
