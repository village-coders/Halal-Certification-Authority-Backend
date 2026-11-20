const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinaryConfig = require("./cloudinary")

const storage = multer.memoryStorage();
const uploadAuthImage = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
module.exports = uploadAuthImage