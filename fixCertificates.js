const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// ============================================================================
// CONFIGURATION - CHANGE THESE VALUES BEFORE RUNNING
// ============================================================================
const CONFIG = {
    branchIdPrefix: '672048',          // The first 6 characters of the branch _id
    branchName: 'Abuja',               // Human-readable name to confirm we have the right branch
    expiryDate: new Date('2026-12-15'),// Certificate expiry: 15th Dec 2026
    issueDate: new Date(),             // Issue date: today
    certificateFolder: 'NEWREST ABUJA',// Folder name inside /Certificates

    // Certificate details
    certificateType: 'Halal Certification',
    standard: 'HACCP',                 // Must match schema enum — update if needed
    product: ['All Halal Certified Products'],
    remarks: 'Manually added certificate for NEWREST ABUJA branch.',
};
// ============================================================================

// Use actual full models
const Certificate = require('./Models/certificate');
const Branch = require('./Models/branch');
const User = require('./Models/user');

async function addCertificate() {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.Mongo_Url;
        if (!mongoUri) {
            console.error('❌ No MongoDB URI found. Check your .env file for MONGO_URI or Mongo_Url.');
            process.exit(1);
        }

        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to DB\n');

        // ── 1. Find the branch by ID prefix ───────────────────────────────────
        console.log(`🔍 Searching for branch with ID starting with: ${CONFIG.branchIdPrefix}`);
        const allBranches = await Branch.find({});
        const branch = allBranches.find(b => b._id.toString().startsWith(CONFIG.branchIdPrefix));

        if (!branch) {
            console.error(`❌ No branch found with ID prefix "${CONFIG.branchIdPrefix}".`);
            process.exit(1);
        }

        console.log(`✅ Found branch: "${branch.branchName}" (ID: ${branch._id})`);
        if (!branch.branchName.toLowerCase().includes(CONFIG.branchName.toLowerCase())) {
            console.warn(`⚠️  Warning: Branch name "${branch.branchName}" does not contain "${CONFIG.branchName}". Proceeding anyway...`);
        }

        // ── 2. Find the company (user) that owns this branch ──────────────────
        const company = await User.findById(branch.companyId);
        if (!company) {
            console.error(`❌ No company found for companyId: ${branch.companyId}`);
            process.exit(1);
        }
        console.log(`✅ Found company: "${company.companyName || company.fullName}" (ID: ${company._id})`);

        // ── 3. Build certificate file paths from the Certificates folder ──────
        const certFolder = path.join(__dirname, 'Certificates', CONFIG.certificateFolder);
        const certPdfPath = path.join(certFolder, 'certificate.jpeg');
        const labelPdfPath = path.join(certFolder, 'product-label.jpeg');

        console.log(`\n📁 Certificate folder: ${certFolder}`);
        console.log(`   • Certificate file : Certificates/${CONFIG.certificateFolder}/certificate.jpeg`);
        console.log(`   • Label file       : Certificates/${CONFIG.certificateFolder}/product-label.jpeg`);

        // ── 4. Generate a unique certificate number ───────────────────────────
        const count = await Certificate.countDocuments();
        const year = CONFIG.expiryDate.getFullYear();
        const certNumber = `HCA-${String(count + 1).padStart(4, '0')}-${year}`;

        console.log(`\n📜 New Certificate Number: ${certNumber}`);

        // ── 5. Check for duplicate certificate number (safety guard) ──────────
        const existing = await Certificate.findOne({ certificateNumber: certNumber });
        if (existing) {
            console.error(`❌ A certificate with number "${certNumber}" already exists (ID: ${existing._id}).`);
            process.exit(1);
        }

        // ── 6. Create the certificate document ────────────────────────────────
        const certData = {
            certificateNumber: certNumber,
            certificateType: CONFIG.certificateType,
            standard: CONFIG.standard,
            status: 'Active',
            product: CONFIG.product,
            issueDate: CONFIG.issueDate,
            expiryDate: CONFIG.expiryDate,
            companyId: company.registrationNo || company._id.toString(),
            branchId: branch._id,
            pdfPaths: [
                `Certificates/${CONFIG.certificateFolder}/certificate.jpeg`,
                `Certificates/${CONFIG.certificateFolder}/product-label.jpeg`,
            ],
            labelPaths: [
                `Certificates/${CONFIG.certificateFolder}/product-label.jpeg`,
            ],
            generatedBy: 'Admin (Manual Script)',
            remarks: CONFIG.remarks,
        };

        console.log('\n📋 Certificate data summary:');
        console.log(`   • Number      : ${certData.certificateNumber}`);
        console.log(`   • Type        : ${certData.certificateType}`);
        console.log(`   • Standard    : ${certData.standard}`);
        console.log(`   • Company ID  : ${certData.companyId}`);
        console.log(`   • Branch ID   : ${certData.branchId}`);
        console.log(`   • Issue Date  : ${certData.issueDate.toDateString()}`);
        console.log(`   • Expiry Date : ${certData.expiryDate.toDateString()}`);
        console.log(`   • PDF Paths   : ${certData.pdfPaths.join(', ')}`);

        const newCert = await Certificate.create(certData);
        console.log(`\n✅ Certificate successfully created!`);
        console.log(`   MongoDB ID : ${newCert._id}`);
        console.log(`   Number     : ${newCert.certificateNumber}`);
        console.log(`   Status     : ${newCert.status}`);

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err.message || err);
        if (err.errors) {
            Object.entries(err.errors).forEach(([field, e]) => {
                console.error(`   • ${field}: ${e.message}`);
            });
        }
        process.exit(1);
    }
}

addCertificate();
