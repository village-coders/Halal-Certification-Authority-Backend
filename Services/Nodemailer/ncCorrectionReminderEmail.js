const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendNcCorrectionReminderEmail = async (email, companyName) => {
    try {
        console.log("📤 Sending NC correction reminder to:", email);

        const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";
        const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/audits`;

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "⚠️ Action Required: Please Submit Your NC Correction — Halal Certification",
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Dear <strong>${companyName}</strong>,</p>

                    <p>The Halal Team wishes you continued success in your business endeavors.</p>

                    <p>This is a reminder that your <strong>Non-Conformity (NC) Correction</strong> document is still pending submission on your HDI Portal.</p>

                    <p>Our audit team has identified findings during the audit session that require corrective actions from your end. Please upload the corrected action documents as soon as possible to continue with your Halal Certification process.</p>

                    <div style="background-color: #fffbebfb; border-left: 4px solid #d97706; padding: 16px; margin: 24px 0; border-radius: 4px;">
                      <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 17px;">⚠️ Please Note:</p>
                      <p style="margin: 6px 0 0 0; color: #b45309;">
                        Failure to submit your NC correction documents may delay or affect the outcome of your certification application.
                      </p>
                    </div>

                    <p>
                      <strong>Next Step:</strong> Please log in to your HDI Portal dashboard and navigate to <strong>Audits</strong> → <strong>Upload NC Correction</strong>.
                    </p>

                    <div style="text-align: center; margin: 32px 0;">
                      <a href="${clientPortalUrl}" style="background-color: #d97706; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Go to My Audits
                      </a>
                    </div>

                    <p>
                      If you have already submitted or have any questions, please contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.
                    </p>

                    <p style="margin-top: 32px; margin-bottom: 0;">
                      Kind regards,<br />
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
        console.log("📧 NC correction reminder sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending NC correction reminder email:", error);
        throw new Error("Failed to send NC correction reminder email");
    }
};

module.exports = sendNcCorrectionReminderEmail;
