const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.Mongo_Uri);
        console.log('Connected to MongoDB');

        const Certificate = mongoose.model('Certificate', new mongoose.Schema({}, { strict: false }));
        const Application = mongoose.model('Application', new mongoose.Schema({}, { strict: false }));

        const certs = await Certificate.find({}).limit(5).lean();
        console.log('\n--- Certificates ---');
        certs.forEach(c => {
            console.log(`ID: ${c._id}`);
            console.log(`Number: ${c.certificateNumber}`);
            console.log(`PDF Paths: ${JSON.stringify(c.pdfPaths)}`);
            console.log(`PDF Path (old): ${c.pdfPath}`);
            console.log(`Content Type Sample: ${c.pdfPaths?.[0]}`);
        });

        const apps = await Application.find({ status: 'Issued' }).limit(5).lean();
        console.log('\n--- Issued Applications ---');
        apps.forEach(a => {
            console.log(`App Number: ${a.applicationNumber}`);
            console.log(`Cert Files: ${JSON.stringify(a.processData?.certificateFiles)}`);
            console.log(`Label Files: ${JSON.stringify(a.processData?.labelFiles)}`);
        });

        // Check GridFS files
        const db = mongoose.connection.db;
        const files = await db.collection('applicationFiles.files').find({}).limit(5).toArray();
        console.log('\n--- applicationFiles.files ---');
        files.forEach(f => {
            console.log(`Filename: ${f.filename}`);
            console.log(`ContentType: ${f.contentType}`);
        });

        const certFiles = await db.collection('certificatePDFs.files').find({}).limit(5).toArray();
        console.log('\n--- certificatePDFs.files ---');
        certFiles.forEach(f => {
            console.log(`Filename: ${f.filename}`);
            console.log(`ContentType: ${f.contentType}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
