const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.Mongo_Uri || "mongodb://localhost:27017/halal-certification");
        console.log("Connected to MongoDB\n");

        const Certificate = require('../Models/certificate');
        
        const certs = await Certificate.find({});
        console.log(`Found ${certs.length} certificates.`);

        certs.forEach(c => {
            if (!c.pdfPaths || c.pdfPaths.length === 0) {
                console.log(`[!] Cert ${c.certificateNumber} has NO pdfPaths. pdfPath (old): ${c.pdfPath}`);
            } else {
                console.log(`[OK] Cert ${c.certificateNumber} has pdfPaths: ${c.pdfPaths.length}`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
