const userModel = require('../Models/user');

/**
 * Middleware that resolves the "company owner" ObjectId for any logged-in user.
 *
 * - If the user is the main company account (isUnderCompany = false),
 *   req.companyOwnerId is set to the user's own _id.
 * - If the user is a sub-user (isUnderCompany = true),
 *   req.companyOwnerId is set to the parent company's _id (looked up via registrationNo).
 *
 * This allows controllers to query ObjectId-based resources (branches, invoices,
 * audits, notifications, documents, tickets) correctly for both owners and sub-users.
 */
const resolveCompanyUser = async (req, res, next) => {
    try {
        // Admins don't need resolution — they see everything
        if (req.user.role === 'admin' || req.user.role === 'super admin') {
            req.companyOwnerId = req.user._id;
            return next();
        }

        if (!req.user.isUnderCompany) {
            // This is the main company account
            req.companyOwnerId = req.user._id;
            return next();
        }

        // This is a sub-user — find the parent company owner via registrationNo
        if (!req.user.registrationNo) {
            return res.status(400).json({
                status: 'error',
                message: 'Sub-user account has no registration number. Please contact your administrator.'
            });
        }

        const parentCompany = await userModel.findOne({
            registrationNo: req.user.registrationNo,
            isUnderCompany: false,
            role: 'company'
        });

        if (!parentCompany) {
            return res.status(404).json({
                status: 'error',
                message: 'Parent company account not found for this sub-user.'
            });
        }

        req.companyOwnerId = parentCompany._id;
        req.parentCompany = parentCompany; // also attach full parent for convenience
        next();
    } catch (error) {
        console.error('resolveCompanyUser middleware error:', error);
        next(error);
    }
};

module.exports = resolveCompanyUser;
