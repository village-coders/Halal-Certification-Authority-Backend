const express = require('express');
const applicationRouter = express.Router();
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getRenewalApplications
} = require('../Controllers/applicationController');
const isLoggedIn = require('../Middlewares/isLoggedIn');

// GET all applications
applicationRouter.get('/', getApplications);

// GET single application
applicationRouter.get('/:id', getApplication);

// POST create application
applicationRouter.post('/', isLoggedIn, createApplication);

// PUT update application
applicationRouter.put('/:id', updateApplication);

// DELETE application
applicationRouter.delete('/:id', deleteApplication);

// GET applications for renewal
applicationRouter.get('/eligible/renewal', getRenewalApplications);

module.exports = applicationRouter;