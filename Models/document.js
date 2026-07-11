const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    companyId: {
        type: String, // Company Registration No like HDI-1234
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const documentModel = mongoose.model("document", documentSchema);
module.exports = documentModel;
