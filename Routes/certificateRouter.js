const express = require('express');
const certificateRouter = express.Router();
const {
  getCertificates,
  getCertificate,
  generateCertificate,
  downloadCertificate,
  renewCertificate,
  getExpiringCertificates,
  downloadCertificateReport
} = require('../Controllers/certificateController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const isAdmin = require('../Middlewares/isAdmin');

// GET all certificates
certificateRouter.get('/', isLoggedIn, getCertificates);

// POST generate certificate
certificateRouter.post('/generate/:id', generateCertificate);

// GET download certificate PDF
certificateRouter.get('/:id/download', downloadCertificate);

// POST renew certificate
certificateRouter.post('/renew/:id', isAdmin, renewCertificate);

// GET expiring certificates
certificateRouter.get('/expiring/soon', getExpiringCertificates);

certificateRouter.get('/reports/download/:fileId', downloadCertificateReport);

// GET single certificate
certificateRouter.get('/:id', getCertificate);

module.exports = certificateRouter;