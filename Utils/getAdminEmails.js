const userModel = require("../Models/user");

/**
 * Fetches all admin and super admin emails from the database.
 * @returns {Promise<string[]>} Array of admin email addresses.
 */
const getAdminEmails = async () => {
    try {
        const admins = await userModel.find({ role: { $in: ["admin", "super admin"] } }).select('email');
        return admins.map(admin => admin.email).filter(email => !!email);
    } catch (error) {
        console.error("❌ Error fetching admin emails:", error);
        return [];
    }
};

module.exports = getAdminEmails;
