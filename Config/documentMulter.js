const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = multer.memoryStorage();
const uploadDocumentFile = multer({ storage });
module.exports = uploadDocumentFile;
