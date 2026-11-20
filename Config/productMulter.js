const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = multer.memoryStorage();
const uploadProductFile = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
module.exports = uploadProductFile;
