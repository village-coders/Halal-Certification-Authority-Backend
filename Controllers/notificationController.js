const notificationModel = require('../Models/notification');

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel.find({ forAdmin: true }).populate('companyId', 'companyName fullName').sort({ createdAt: -1 }).limit(50);
        const unreadCount = await notificationModel.countDocuments({ isRead: false, forAdmin: true });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await notificationModel.updateMany({ isRead: false, forAdmin: true }, { $set: { isRead: true } });
        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const clearNotification = async (req, res) => {
    try {
        await notificationModel.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Notification cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const clearAllNotifications = async (req, res) => {
    try {
        await notificationModel.deleteMany({ forAdmin: true });
        res.status(200).json({ success: true, message: 'All admin notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getUserNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel.find({ forAdmin: false, companyId: req.user.id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await notificationModel.countDocuments({ isRead: false, forAdmin: false, companyId: req.user.id });

        res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markUserAsRead = async (req, res) => {
    try {
        await notificationModel.updateMany({ isRead: false, forAdmin: false, companyId: req.user.id }, { $set: { isRead: true } });
        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const markReadByType = async (req, res) => {
    try {
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({ success: false, message: 'Notification type is required' });
        }
        await notificationModel.updateMany({ isRead: false, forAdmin: false, companyId: req.user.id, type }, { $set: { isRead: true } });
        res.status(200).json({ success: true, message: `Notifications of type ${type} marked as read` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const clearUserNotification = async (req, res) => {
    try {
        await notificationModel.findOneAndDelete({ _id: req.params.id, companyId: req.user.id });
        res.status(200).json({ success: true, message: 'Notification cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const clearAllUserNotifications = async (req, res) => {
    try {
        await notificationModel.deleteMany({ forAdmin: false, companyId: req.user.id });
        res.status(200).json({ success: true, message: 'All notifications cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const dismissModalNotifications = async (req, res) => {
    try {
        await notificationModel.updateMany(
            { forAdmin: false, companyId: req.user.id, showAsModal: true },
            { $set: { showAsModal: false } }
        );
        res.status(200).json({ success: true, message: 'Modal notifications dismissed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    getUserNotifications,
    markUserAsRead,
    markReadByType,
    clearUserNotification,
    clearAllUserNotifications,
    dismissModalNotifications
};
