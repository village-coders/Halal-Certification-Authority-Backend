const express = require('express');
const documentRouter = express.Router();
const documentController = require('../Controllers/documentController');
const uploadDocumentFile = require('../Config/documentMulter');
const isAdmin = require('../Middlewares/adminOnly');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const resolveCompanyUser = require('../Middlewares/resolveCompanyUser');

// Upload a document (Clients)
documentRouter.post(
    '/',
    isLoggedIn,
    resolveCompanyUser,
    uploadDocumentFile.single("document"),
    documentController.uploadDocument
);

// Get Client's documents
documentRouter.get('/my-documents', isLoggedIn, resolveCompanyUser, documentController.getMyDocuments);

// Get All Documents (Admins)
documentRouter.get('/all', isLoggedIn, isAdmin, documentController.getAllDocuments);

// Delete a document (Clients/Admins)
documentRouter.delete('/:id', isLoggedIn, resolveCompanyUser, documentController.deleteDocument);

module.exports = documentRouter;
    