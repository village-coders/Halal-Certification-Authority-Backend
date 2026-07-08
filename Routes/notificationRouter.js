const express = require('express');
const router = express.Router();
const { 
    getNotifications, markAsRead, clearNotification, clearAllNotifications,
    getUserNotifications, markUserAsRead, clearUserNotification, clearAllUserNotifications
} = require('../Controllers/notificationController');
const isLoggedIn = require('../Middlewares/isLoggedIn');
const isAdmin = require('../Middlewares/isAdmin');

router.get('/', isLoggedIn, isAdmin, getNotifications);
router.put('/mark-read', isLoggedIn, isAdmin, markAsRead);
router.delete('/clear-all', isLoggedIn, isAdmin, clearAllNotifications);
router.delete('/:id', isLoggedIn, isAdmin, clearNotification);

router.get('/user', isLoggedIn, getUserNotifications);
router.put('/user/mark-read', isLoggedIn, markUserAsRead);
router.delete('/user/clear-all', isLoggedIn, clearAllUserNotifications);
router.delete('/user/:id', isLoggedIn, clearUserNotification);

module.exports = router;
