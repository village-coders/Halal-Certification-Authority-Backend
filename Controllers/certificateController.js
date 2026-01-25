const Certificate = require('../Models/certificate');
const applicationModel = require('../Models/application');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Get all certificates
const getCertificates = async (req, res, next) => {
  try {
    const { status } = req.query;
    const companyId = req.user.registrationNo;
    
    const filter = {};
    if (req.user.role !== 'admin' && companyId) filter.companyId = companyId;
    if (status) filter.status = status;
    
    const certificates = await applicationModel.find(filter)
      .sort({ expiryDate: 1 })
      .populate('applicationId', 'applicationNumber category');
    
    res.json(certificates);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

// Get single certificate
const getCertificate = async (req, res, next) => {
  try {
    const certificate = await applicationModel.findById(req.params.id)
      .populate('applicationId', 'applicationNumber category description');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Generate certificate from approved application
const generateCertificate = async (req, res, next) => {
  try {
    const { applicationId, companyId } = req.body;
    
    // Find the approved application
    const application = await applicationModel.findById(applicationId);
    if (!application) {
        return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.status !== 'Approved') {
        return res.status(400).json({ message: 'Application must be approved to generate certificate' });
    }
    
    // Check if certificate already exists
    const existingCertificate = await applicationModel.findOne({ applicationId });
    if (existingCertificate) {
        return res.status(400).json({ message: 'Certificate already exists for this application' });
    }
    
    // Generate certificate number
    const year = new Date().getFullYear();
    const count = await applicationModel.countDocuments({ 
        issueDate: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }
    });
    const certificateNumber = `CERT-${year}-${String(count + 1).padStart(3, '0')}`;
    
    // Calculate expiry date (1 year from approval)
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Create certificate
    const certificate = new applicationModel({
        certificateNumber,
        certificateType: application.category,
        standard: 'ISO 22000:2018', // Default standard, can be customized
        status: 'Active',
        product: application.product,
        issueDate,
        expiryDate,
        applicationId: application._id,
        companyId,
        generatedBy: 'System'
    });
    
    await certificate.save();
    
    // Update application status
    application.status = 'Certified';
    await application.save();
    
    // Generate PDF
    await generateCertificatePDF(certificate);
    
    res.status(201).json(certificate);
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Download certificate PDF
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await applicationModel.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    const pdfPath = certificate.pdfPath || await generateCertificatePDF(certificate);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error('Certificate PDF not found');
    }
    
    res.download(pdfPath, `${certificate.certificateNumber}.pdf`);
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Renew certificate
const renewCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.body;
    
    const certificate = await applicationModel.findById(certificateId);
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Create new certificate for renewal
    const year = new Date().getFullYear();
    const count = await applicationModel.countDocuments({ 
      issueDate: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }
    });
    const prefix = req.user.companyName.split(' ')[0].charAt(2).toUpperCase();
    const newCertificateNumber = `CERT-${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
    
    // Calculate new dates
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Create new certificate
    const newCertificate = new applicationModel({
      certificateNumber: newCertificateNumber,
      certificateType: certificate.certificateType,
      standard: certificate.standard,
      status: 'Pending',
      product: certificate.product,
      issueDate,
      expiryDate,
      applicationId: certificate.applicationId,
      companyId: certificate.companyId,
      generatedBy: 'System',
      remarks: `Renewal of ${certificate.certificateNumber}`
    });
    
    await newCertificate.save();
    
    // Update old certificate status
    certificate.status = 'Expired';
    await certificate.save();
    
    res.json({
      message: 'Certificate renewal initiated',
      certificate: newCertificate
    });
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Get expiring certificates
const getExpiringCertificates = async (req, res, next) => {
  try {
    const { companyId, days = 30 } = req.query;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() + parseInt(days));
    
    const filter = {
      expiryDate: { $lte: dateThreshold, $gte: new Date() },
      status: 'Active'
    };
    
    if (companyId) filter.companyId = companyId;
    
    const certificates = await applicationModel.find(filter)
      .sort({ expiryDate: 1 })
      .populate('applicationId', 'applicationNumber');
    
    res.json(certificates);
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Helper function to generate PDF
const generateCertificatePDF = async (certificate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });
      
      const uploadsDir = path.join(__dirname, '../uploads/certificates');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const pdfPath = path.join(uploadsDir, `${certificate.certificateNumber}.pdf`);
      const writeStream = fs.createWriteStream(pdfPath);
      
      doc.pipe(writeStream);
      
      // Add certificate content
      doc.fontSize(28).text('CERTIFICATE OF COMPLIANCE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('This certifies that', { align: 'center' });
      doc.moveDown();
      doc.fontSize(22).text(certificate.product, { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text('complies with', { align: 'center' });
      doc.moveDown();
      doc.fontSize(20).text(certificate.standard, { align: 'center' });
      doc.moveDown(2);
      
      // Add certificate details
      doc.fontSize(12);
      doc.text(`Certificate Number: ${certificate.certificateNumber}`);
      doc.text(`Certificate Type: ${certificate.certificateType}`);
      doc.text(`Issue Date: ${certificate.issueDate.toLocaleDateString()}`);
      doc.text(`Expiry Date: ${certificate.expiryDate.toLocaleDateString()}`);
      doc.text(`Status: ${certificate.status}`);
      doc.moveDown(2);
      
      // Add footer
      doc.fontSize(10).text('This certificate is electronically generated and valid without signature.', { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        certificate.pdfPath = pdfPath;
        certificate.save();
        resolve(pdfPath);
      });
      
      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getCertificates,
  getCertificate,
  generateCertificate,
  downloadCertificate,
  renewCertificate,
  getExpiringCertificates
};