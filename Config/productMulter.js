const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

const storage = multer.memoryStorage();
const uploadProductFile = multer({ storage });
module.exports = uploadProductFile;
