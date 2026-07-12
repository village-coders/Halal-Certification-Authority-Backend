const express = require('express');
const router = express.Router();
const { createLogsheet, getLogsheets, getLogsheet, signLogsheet, rejectLogsheet } = require('../Controllers/logsheetController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const upload = require('../Config/documentMulter');

router.use(isLoggedIn);

router.post('/create', upload.fields([{ name: 'auditReport', maxCount: 1 }, { name: 'labResult', maxCount: 1 }, { name: 'additionalDocuments', maxCount: 10 }]), createLogsheet);
router.get('/', getLogsheets);
router.get('/:applicationId', getLogsheet);
router.post('/sign', signLogsheet);
router.post('/reject', rejectLogsheet);

module.exports = router;
