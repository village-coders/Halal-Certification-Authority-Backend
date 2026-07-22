const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

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

        const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";
        const adminPortalUrl = `${process.env.ADMIN_DOMAIN || 'https://admin.halalcertificationauthority.org'}/sharia-board`;

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `📜 Review Required: Logsheet for ${companyName} (${applicationNumber})`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Dear <strong>${memberName}</strong>,</p>

                    <p>A new logsheet has been submitted and is ready for Shari'a Board review and endorsement.</p>
                    
                    <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-weight: bold; color: #166534; font-size: 16px;">Application Details</p>
                        <ul style="margin: 8px 0 0 0; color: #15803d; padding-left: 20px;">
                            <li><strong>Company:</strong> ${companyName}</li>
                            <li><strong>Application Number:</strong> ${applicationNumber}</li>
                        </ul>
                    </div>

                    <p>Please log in to the administrative portal to review the audit report, assess the application details, and provide your digital signature under the Shari'a Board Panel.</p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${adminPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">View Logsheet</a>
                    </div>
                    
                    <p>Thank you for your timely review and continued dedication to maintaining Halal standards.</p>

                    <p style="margin-top: 32px; margin-bottom: 0;">
                      Best regards,<br />
                      <strong>The Halal Team</strong><br />
                      Halal & Haram Distinction Development Initiative (HDI)
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
                    <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
                      <p style="margin: 4px 0; font-weight: bold; color: #333;">The Halal & Haram Distinction Development Initiative (HDI) Team</p>
                      <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
                      <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
                    </footer>
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
