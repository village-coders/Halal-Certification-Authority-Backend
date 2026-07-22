const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendAuditReportUploadedEmail = async (email, companyName, applicationId) => {
    try {
        console.log("📤 Sending audit report upload notification to:", email);

        const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";
        const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/track-application/${applicationId}`;

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "📎 Audit Report Available — Halal & Haram Distinction Development Initiative",
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

                    <p>An audit report has been uploaded for your application <strong>${applicationId}</strong>.</p>
                    
                    <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-weight: bold; color: #166534;">Audit Report Available:</p>
                        <p style="margin: 6px 0 0 0; color: #15803d;">
                            Please log in to your HDI Portal dashboard to view the report and review any necessary details.
                        </p>
                    </div>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Go to Dashboard</a>
                    </div>

                    <p>If you have any questions or require assistance, please feel free to contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.</p>

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
        console.log("📧 Audit report notification sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending audit report email:", error);
        throw new Error("Failed to send audit report email");
    }
};

module.exports = sendAuditReportUploadedEmail;
