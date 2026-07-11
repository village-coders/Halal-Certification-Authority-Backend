const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const applicationSchema = new mongoose.Schema({
    branchId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const certificateSchema = new mongoose.Schema({
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
    branchId: mongoose.Schema.Types.ObjectId,
}, { strict: false });

const Application = mongoose.model('Application', applicationSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

async function fixCertificates() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to DB');

        const certs = await Certificate.find({ branchId: { $exists: false } }).populate('applicationId');
        let count = 0;
        
        for (const cert of certs) {
            if (cert.applicationId && cert.applicationId.branchId) {
                cert.branchId = cert.applicationId.branchId;
                await cert.save();
                count++;
            }
        }
        console.log(`Updated ${count} certificates with missing branchId`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixCertificates();
