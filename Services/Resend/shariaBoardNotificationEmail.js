const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email to a Shari'a Board member alerting them that a logsheet requires their review.
 * @param {string} email - Shari'a Board member's email address.
 * @param {string} memberName - Shari'a Board member's full name.
 * @param {string} companyName - Name of the application company.
 * @param {string} applicationNumber - The application number.
 */
const sendShariaBoardNotificationEmail = async (email, memberName, companyName, applicationNumber) => {
    try {
        console.log(`📤 Sending Shari'a Board notification email to:`, email);

        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: email,
            subject: `📜 Review Required: Logsheet for ${companyName} (${applicationNumber})`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00853b;">Halal And Haram Distinction Initiative Development</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${memberName},</p>
                        <p>A new logsheet has been submitted and is ready for Shari'a Board review and endorsement.</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold; color: #111827; font-size: 16px;">Application Details</p>
                            <ul style="margin: 8px 0 0 0; color: #4b5563; padding-left: 20px;">
                                <li><strong>Company:</strong> ${companyName}</li>
                                <li><strong>Application Number:</strong> ${applicationNumber}</li>
                            </ul>
                        </div>

                        <p>Please log in to the administrative portal to review the audit report, assess the application details, and provide your digital signature under the Shari'a Board Panel.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.ADMIN_DOMAIN || 'https://admin.halalcertificationauthority.org'}/sharia-board" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Logsheet</a>
                        </div>
                        
                        <p>Thank you for your timely review and continued dedication to maintaining Halal standards.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log(`📧 Shari'a board notification email sent successfully to ${email}!`);
        return data;
    } catch (error) {
        console.error(`❌ Error sending Shari'a board notification email to ${email}:`, error);
        return null;
    }
};

module.exports = sendShariaBoardNotificationEmail;
