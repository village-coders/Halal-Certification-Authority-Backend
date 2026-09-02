const express = require('express');
const router = express.Router();
const { updateCompanyDetails, getCompanyLogs } = require('../Controllers/companyLogController');
const isLoggedIn = require('../Middlewares/isLoggedIn');

router.get('/', isLoggedIn, getCompanyLogs);
router.put('/company/:id', isLoggedIn, updateCompanyDetails);

module.exports = router;
