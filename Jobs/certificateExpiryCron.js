const cron = require('node-cron');
const Certificate = require('../Models/certificate');
const User = require('../Models/user');
const certificateExpiryEmail = require('../Services/Resend/certificateExpiryEmail');

const startCertificateExpiryCron = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily check for expiring certificates...');
        try {
            // Find today + 90 days
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + 90);

            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const certificates = await Certificate.find({
                status: { $in: ['Active', 'Expiring Soon'] },
                expiryDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            console.log(`[CRON] Found ${certificates.length} certificates expiring in exactly 90 days.`);

            for (const cert of certificates) {
                try {
                    const user = await User.findOne({ registrationNo: cert.companyId });
                    if (user) {
                        const dateStr = new Date(cert.expiryDate).toLocaleDateString('en-GB');
                        await certificateExpiryEmail(user.email, user.fullName || user.companyName, cert.certificateNumber, dateStr);
                    } else {
                        console.log(`[CRON] Could not find user for companyId: ${cert.companyId}`);
                    }
                } catch (emailError) {
                    console.error(`[CRON] Failed to process email for ${cert.certificateNumber}: ${emailError.message}`);
                }
            }
        } catch (err) {
            console.error('[CRON] Error during certificate expiry check:', err);
        }
    });
};

module.exports = startCertificateExpiryCron;
