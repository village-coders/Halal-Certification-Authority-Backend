const express = require('express');
const impersonateLogRouter = express.Router();
const isLoggedIn = require('../Middlewares/isLoggedIn');
const { createLog, endLog, getLogs } = require('../Controllers/impersonateLogController');

// All routes require authentication
impersonateLogRouter.post('/', isLoggedIn, createLog);
impersonateLogRouter.patch('/:id/end', isLoggedIn, endLog);
impersonateLogRouter.get('/', isLoggedIn, getLogs);

module.exports = impersonateLogRouter;
