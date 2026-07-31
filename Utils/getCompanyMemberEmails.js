const userModel = require('../Models/user');

/**
 * Fetches all email addresses for a company — the main account AND all sub-users.
 * Used to send email notifications to every member of a company.
 *
 * @param {string} registrationNo - The company's registration number.
 * @returns {Promise<string[]>} Array of all company member email addresses.
 */
const getCompanyMemberEmails = async (registrationNo) => {
    try {
        if (!registrationNo) return [];
        const members = await userModel
            .find({ registrationNo, isActive: { $ne: false } })
            .select('email');
        return members.map(m => m.email).filter(Boolean);
    } catch (error) {
        console.error('❌ Error fetching company member emails:', error);
        return [];
    }
};

module.exports = getCompanyMemberEmails;
