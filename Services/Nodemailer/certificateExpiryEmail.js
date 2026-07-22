const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client when an admin sends a certificate expiring soon reminder.
 *
 * @param {string} email - Client's email address.
 * @param {string} name - Name of the client/company.
 * @param {string} certificateNumber - Certificate Number.
 * @param {string} expiryDate - Expiry Date string.
 */
const certificateExpiryEmail = async (email, name, certificateNumber, expiryDate) => {
    try {
        console.log("📤 Sending certificate expiring soon email to:", email);

        const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/applications`;
        const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `⚠️ Certificate Expiring Soon — ${certificateNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

                    <p>The Halal Team wishes you continued success in your business endeavors.</p>

                    <p>
                      We wish to inform you that your Halal Certificate (<strong>${certificateNumber}</strong>) is scheduled to expire on <strong>${expiryDate}</strong>. To ensure uninterrupted certification, we recommend commencing the recertification process before the expiry date.
                    </p>

                    <div style="background-color: #fffbebfb; border-left: 4px solid #d97706; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 17px;">Next Step:</p>
                      <p style="margin: 6px 0 0 0; color: #b45309;">
                        Please log in to your HDI Portal dashboard to complete and submit your recertification application, together with your updated Company Profile and current regulatory documents. Starting the recertification process early will help ensure timely renewal of your Halal Certificate.
                      </p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Start Recertification
                      </a>
                    </div>

                    <p>
                      If you have any questions or require assistance, please do not hesitate to contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.
                    </p>

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
        console.log("📧 Certificate expiring soon email sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending certificate expiry email:", error);
        throw new Error("Failed to send certificate expiry email");
    }
};

module.exports = certificateExpiryEmail;
