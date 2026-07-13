const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



/**
 * Sends a generic tracking update email to the applicant.
 * @param {string} email - Applicant's email address.
 * @param {string} companyName - Name of the company.
 * @param {string} applicationNumber - The application number.
 * @param {string} stepName - The name of the process step (e.g., "Payment Received").
 * @param {string} message - A descriptive message about the update.
 */
const sendTrackingUpdateEmail = async (email, companyName, applicationNumber, stepName, message) => {
    try {
        console.log(`📤 Sending tracking update email (${stepName}) to:`, email);

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `🔔 Progress Update: ${stepName} — Application ${applicationNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00853b;">Halal And Haram Distinction Initiative Development</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${companyName},</p>
                        <p>We are writing to provide you with an update on your Halal Certification application (<strong>${applicationNumber}</strong>).</p>
                        
                        <div style="background-color: #f9fafb; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; font-weight: bold; color: #111827; font-size: 18px;">${stepName}</p>
                            <p style="margin: 8px 0 0 0; color: #4b5563;">${message}</p>
                        </div>

                        <p>You can track the real-time progress of your application and view details by logging into your dashboard.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.client_domain || 'https://halalcertificationauthority.org'}/track-application/${applicationNumber}" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Progress</a>
                        </div>
                        
                        <p>If you have any questions or require further assistance, please do not hesitate to reach out to our support team.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                        <p>Providing Distinction and Development in Halal Standards.</p>
                    </div>
                </div>
            `,
        });
        console.log(`📧 Tracking update email (${stepName}) sent successfully!`);
        return data;
    } catch (error) {
        console.error(`❌ Error sending tracking update email (${stepName}):`, error);
        // We don't want to throw here to avoid breaking the main process flow if email fails
        return null;
    }
};

module.exports = sendTrackingUpdateEmail;
