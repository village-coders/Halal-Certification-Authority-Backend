const express = require('express');
const applicationRouter = express.Router();
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getRenewalApplications,
  acceptApplication,
  rejectApplication,
  renewApplication,
  updateProcessStep,
  processUpload
} = require('../Controllers/applicationController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const adminOnly = require('../Middlewares/adminOnly');

// GET all applications
applicationRouter.get('/', isLoggedIn, getApplications);

// GET single application
applicationRouter.get('/:id', isLoggedIn, getApplication);

// POST create application  
applicationRouter.post('/', isLoggedIn, processUpload.fields([
  {name: 'mancapDocument', maxCount: 1},
  {name: 'nafdacDocument', maxCount: 1},
  {name: 'cacDocument', maxCount: 1},
  {name: 'companyProfileDocument', maxCount: 1},
  {name: 'rawMaterialsDocument', maxCount: 1}
]), createApplication);

// PUT update application
applicationRouter.put('/:id', isLoggedIn, updateApplication);

// DELETE application
applicationRouter.delete('/:id', isLoggedIn, deleteApplication);

// Renew application
applicationRouter.put('/renew/:id', isLoggedIn, renewApplication);

applicationRouter.put('/:id/reject', isLoggedIn, adminOnly, rejectApplication);

applicationRouter.put('/:id/accept', isLoggedIn, adminOnly, acceptApplication);

// GET applications for renewal
applicationRouter.get('/eligible/renewal', isLoggedIn, getRenewalApplications);

// PATCH update process step
applicationRouter.patch('/:id/process', isLoggedIn, adminOnly, updateProcessStep);

module.exports = applicationRouter;