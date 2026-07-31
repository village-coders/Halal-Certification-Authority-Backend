const express = require('express');
const router = express.Router();
const { 
    getNotifications, markAsRead, clearNotification, clearAllNotifications,
    getUserNotifications, markUserAsRead, markReadByType, clearUserNotification,
    clearAllUserNotifications, dismissModalNotifications, dismissSingleModalNotification
} = require('../Controllers/notificationController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const isAdmin = require('../Middlewares/isAdmin');
const resolveCompanyUser = require('../Middlewares/resolveCompanyUser');

router.get('/', isLoggedIn, isAdmin, getNotifications);
router.put('/mark-read', isLoggedIn, isAdmin, markAsRead);
router.delete('/clear-all', isLoggedIn, isAdmin, clearAllNotifications);
router.delete('/:id', isLoggedIn, isAdmin, clearNotification);

router.get('/user', isLoggedIn, resolveCompanyUser, getUserNotifications);
router.put('/user/mark-read', isLoggedIn, resolveCompanyUser, markUserAsRead);
router.put('/user/mark-read-by-type', isLoggedIn, resolveCompanyUser, markReadByType);
router.post('/user/dismiss-modal', isLoggedIn, resolveCompanyUser, dismissModalNotifications);
router.post('/user/dismiss-modal/:id', isLoggedIn, resolveCompanyUser, dismissSingleModalNotification);
router.delete('/user/clear-all', isLoggedIn, resolveCompanyUser, clearAllUserNotifications);
router.delete('/user/:id', isLoggedIn, resolveCompanyUser, clearUserNotification);

module.exports = router;

