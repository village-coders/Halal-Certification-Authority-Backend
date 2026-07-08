const express = require('express');
const router = express.Router();
const { getFile, getFileByBucket } = require('../Controllers/fileController');

// No auth required for public file access (links sent via email)
// Or you can add auth if needed, but for public reports it might be better to be accessible
router.get('/:id', getFile);
router.get('/:bucket/:filename', getFileByBucket);

module.exports = router;
