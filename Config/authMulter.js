const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinaryConfig = require("./cloudinary")

const storage = multer.memoryStorage();
const uploadAuthImage = multer({ storage });
module.exports = uploadAuthImage