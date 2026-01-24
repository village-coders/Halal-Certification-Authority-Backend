const express = require('express');
const certificateRouter = express.Router();
const {
  getCertificates,
  getCertificate,
  generateCertificate,
  downloadCertificate,
  renewCertificate,
  getExpiringCertificates
} = require('../Controllers/certificateController');

// GET all certificates
certificateRouter.get('/', getCertificates);

// GET single certificate
certificateRouter.get('/:id', getCertificate);

// POST generate certificate
certificateRouter.post('/generate', generateCertificate);

// GET download certificate PDF
certificateRouter.get('/:id/download', downloadCertificate);

// POST renew certificate
certificateRouter.post('/renew', renewCertificate);

// GET expiring certificates
certificateRouter.get('/expiring/soon', getExpiringCertificates);

module.exports = certificateRouter;