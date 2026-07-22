const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the auditor notifying them of a scheduled audit.
 * @param {string} auditorEmail - The auditor's email address.
 * @param {string} auditorName - The auditor's full name.
 * @param {string} auditorRole - The role assigned (Lead Auditor, Auditor, etc.).
 * @param {string} companyName - The company being audited.
 * @param {string} applicationNumber - The application number for the audit.
 * @param {string} scheduledDate - The scheduled audit date (formatted string).
 * @param {string} scheduledTime - The scheduled audit time.
 */
const sendAuditScheduledEmail = async (
  auditorEmail,
  auditorName,
  auditorRole,
  companyName,
  applicationNumber,
  scheduledDate,
  scheduledTime
) => {
  try {
    console.log("📤 Sending audit scheduled email to auditor:", auditorEmail);

    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: auditorEmail,
      subject: "📋 Audit Scheduled — Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${auditorName}</strong>,</p>

            <p>
              You have been assigned as the <strong>${auditorRole}</strong> for the following Halal certification audit.
              Please review the details below and ensure you are prepared for the scheduled date.
            </p>

            <table style="border-collapse: collapse; width: 100%; margin: 24px 0; font-size: 15px;">
              <tr style="background: #f3f4f6;">
                <td style="padding: 10px 16px; font-weight: 600; border: 1px solid #e5e7eb;">Company</td>
                <td style="padding: 10px 16px; border: 1px solid #e5e7eb;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: 600; border: 1px solid #e5e7eb;">Application Number</td>
                <td style="padding: 10px 16px; border: 1px solid #e5e7eb;">${applicationNumber}</td>
              </tr>
              <tr style="background: #f3f4f6;">
                <td style="padding: 10px 16px; font-weight: 600; border: 1px solid #e5e7eb;">Scheduled Date</td>
                <td style="padding: 10px 16px; border: 1px solid #e5e7eb;">${scheduledDate}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; font-weight: 600; border: 1px solid #e5e7eb;">Scheduled Time</td>
                <td style="padding: 10px 16px; border: 1px solid #e5e7eb;">${scheduledTime || "To be confirmed"}</td>
              </tr>
            </table>

            <p>
              Please log in to the admin portal if you need further details about this application.
              If you have any conflicts or concerns about this schedule, please contact the administration team immediately.
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

    console.log("📧 Audit scheduled email sent to auditor!");
  } catch (error) {
    console.error("❌ Failed to send audit scheduled email:", error);
  }
};

module.exports = sendAuditScheduledEmail;
