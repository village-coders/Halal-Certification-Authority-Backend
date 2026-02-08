// Controllers/certificateController.js
const Certificate = require('../Models/certificate');
const applicationModel = require('../Models/application');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const certificateModel = require('../Models/certificate');
const userModel = require('../Models/user');
const sendCertificateIssuedEmail = require('../Services/Resend/certificateIssuedEmail');
const { Readable } = require('stream');
const { getGridFSBucket } = require('../Config/connectToDb');

// Get all certificates
const getCertificates = async (req, res, next) => {
  try {
    const { status } = req.query;
    const companyId = req.user.registrationNo;
    
    const filter = {};
    if (req.user.role !== 'admin' && req.user.role !== 'super admin' && companyId) filter.companyId = companyId;
    if (status) filter.status = status;
    
    const certificates = await certificateModel.find(filter)
      .sort({ expiryDate: 1 })
      .populate('applicationId', 'applicationNumber category')
      .populate('product', 'name category status');
    
    res.json(certificates);
  } catch (error) {
    console.log(error);
    next(error)
  }
};

// Get single certificate
const getCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateModel.findById(req.params.id)
      .populate('applicationId', 'applicationNumber category description')
      .populate('product', 'name category status');
    
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
    const { id } = req.params;
    
    // Find the approved application  
    const application = await applicationModel.findById(id);
    console.log(application)
    if (!application) {
        return res.status(404).json({ message: 'Application not found' });
    }
    
    if (application.status !== 'Approved') {
        return res.status(400).json({ message: 'Application must be approved to generate certificate' });
    }
    
    // Check if certificate already exists
    const existingCertificate = await certificateModel.findOne({
      applicationId: application._id
    });
    
    if (existingCertificate) {
        return res.status(400).json({ message: 'Certificate already exists for this application' });
    }
    
    // Generate certificate number
    const year = new Date().getFullYear();
    const count = await certificateModel.countDocuments({ 
      issueDate: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) }
    });
    const certificateNumber = `CERT-${year}-${String(count + 1).padStart(3, '0')}`;
    
    // Calculate expiry date (1 year from approval)
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    
    // Create certificate
    const certificate = new certificateModel({
        certificateNumber,
        certificateType: application.category,
        standard: 'ISO 22000:2018',
        status: 'Active',
        product: application.productId,
        issueDate,
        expiryDate,
        applicationId: application._id,
        companyId: application.companyId,
        generatedBy: "Admin"
    });
    
    const company = await userModel.findOne({registrationNo: application.companyId})
    if(!company){
      return res.status(404).json({message: "company not found"})
    }
    
    await certificate.save();
    
    // Generate PDF and save to GridFS
    const pdfFileId = await generateCertificatePDF(certificate);
    
    // Update certificate with PDF file ID
    certificate.pdfFileId = pdfFileId;
    await certificate.save();
    
    // Update application status
    application.status = 'Issued';
    await application.save();
    
    await sendCertificateIssuedEmail(company.email, company.companyName, application.applicationNumber, certificate.certificateNumber)
    
    res.status(201).json({
      ...certificate.toObject(),
      pdfDownloadUrl: `/api/certificates/download/${certificate._id}`
    });
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Download certificate PDF from GridFS
const downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await certificateModel.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Check if PDF exists in GridFS
    if (!certificate.pdfFileId) {
      return res.status(404).json({ message: 'Certificate PDF not found' });
    }
    
    const bucket = getGridFSBucket();
    const downloadStream = bucket.openDownloadStream(certificate.pdfFileId);
    
    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificateNumber}.pdf"`,
    });
    
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to download certificate' });
    });
    
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// Renew certificate
const renewCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    
    const certificate = await certificateModel.findById(certificateId);
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
    const newCertificate = new certificateModel({
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
    const { companyId, days = 30, generatePDF = 'false' } = req.query;
    
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() + parseInt(days));
    
    const filter = {
      expiryDate: { $lte: dateThreshold, $gte: new Date() },
      status: 'Active'
    };
    
    if (companyId) filter.companyId = companyId;
    
    const certificates = await certificateModel.find(filter)
      .sort({ expiryDate: 1 })
      .populate('applicationId', 'applicationNumber')
      .populate('companyId', 'name')
      .populate('product', 'name');
    
    // If PDF not requested, return data only
    if (generatePDF === 'false') {
      return res.json(certificates);
    }
    
    // Generate and save PDF report to GridFS
    const pdfFileId = await generateExpiringCertificatesPDF(certificates, parseInt(days));
    
    res.json({
      certificates: certificates,
      reportId: pdfFileId,
      downloadUrl: `/api/certificates/reports/download/${pdfFileId}`,
      message: 'Report generated successfully'
    });
    
  } catch (error) {
    console.log(error)
    next(error)
  }
};

// NEW: Helper function to generate expiring certificates PDF report
const generateExpiringCertificatesPDF = async (certificates, daysThreshold) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        compress: true
      });
      
      const pdfChunks = [];
      doc.on('data', chunk => pdfChunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(pdfChunks);
          const bucket = getGridFSBucket();
          
          const fileName = `expiring-certificates-${Date.now()}.pdf`;
          const uploadStream = bucket.openUploadStream(fileName, {
            contentType: 'application/pdf',
            metadata: {
              reportType: 'expiring_certificates',
              daysThreshold: daysThreshold,
              certificateCount: certificates.length,
              generatedAt: new Date()
            }
          });
          
          const readableStream = new Readable();
          readableStream.push(pdfBuffer);
          readableStream.push(null);
          
          readableStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
              resolve(uploadStream.id);
            });
            
        } catch (error) {
          reject(error);
        }
      });
      
      // PDF Content
      doc.fontSize(20).text('Expiring Certificates Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.text(`Certificates expiring within ${daysThreshold} days: ${certificates.length}`, { align: 'center' });
      doc.moveDown(2);
      
      certificates.forEach((cert, index) => {
        const daysLeft = Math.ceil((cert.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        doc.fontSize(10)
           .text(`${index + 1}. ${cert.certificateNumber}`)
           .text(`   Product: ${cert.product?.name || 'N/A'}`)
           .text(`   Company: ${cert.companyId?.name || 'N/A'}`)
           .text(`   Expiry Date: ${cert.expiryDate.toLocaleDateString()}`)
           .text(`   Days Remaining: ${daysLeft}`)
           .moveDown();
      });
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

// UPDATED: Helper function to generate certificate PDF and save to GridFS
const generateCertificatePDF = async (certificate) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        compress: true
      });
      
      const pdfChunks = [];
      doc.on('data', chunk => pdfChunks.push(chunk));
      
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(pdfChunks);
          const bucket = getGridFSBucket();
          
          const uploadStream = bucket.openUploadStream(
            `${certificate.certificateNumber}.pdf`,
            {
              contentType: 'application/pdf',
              metadata: {
                certificateNumber: certificate.certificateNumber,
                certificateId: certificate._id,
                companyId: certificate.companyId,
                generatedAt: new Date()
              }
            }
          );
          
          const readableStream = new Readable();
          readableStream.push(pdfBuffer);
          readableStream.push(null);
          
          readableStream.pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
              resolve(uploadStream.id);
            });
            
        } catch (error) {
          reject(error);
        }
      });
      
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
      
    } catch (error) {
      reject(error);
    }
  });
};

// NEW: Download report from GridFS
const downloadCertificateReport = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const bucket = getGridFSBucket();
    
    // Find file metadata
    const files = await bucket.find({ _id: fileId }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const file = files[0];
    const downloadStream = bucket.openDownloadStream(fileId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${file.filename}"`,
    });
    
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to download report' });
    });
    
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// NEW: Cleanup old PDFs (optional maintenance)
const cleanupOldPDFs = async (daysOld = 90) => {
  try {
    const bucket = getGridFSBucket();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldFiles = await bucket.find({
      'metadata.generatedAt': { $lt: cutoffDate }
    }).toArray();
    
    for (const file of oldFiles) {
      await bucket.delete(file._id);
      console.log(`Cleaned up old PDF: ${file.filename}`);
    }
    
    console.log(`Cleaned up ${oldFiles.length} old PDF files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

// Run cleanup periodically (optional)
// setInterval(() => cleanupOldPDFs(), 7 * 24 * 60 * 60 * 1000); // Weekly

module.exports = {
  getCertificates,
  getCertificate,
  generateCertificate,
  downloadCertificate,
  renewCertificate,
  getExpiringCertificates,
  downloadCertificateReport,
  cleanupOldPDFs
};