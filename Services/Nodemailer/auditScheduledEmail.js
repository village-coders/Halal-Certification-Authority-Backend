const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



/**
 * Sends an email to the lead auditor notifying them of a scheduled audit.
 * @param {string} auditorEmail - The lead auditor's email address.
 * @param {string} auditorName - The lead auditor's full name.
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
    console.log("📤 Sending audit scheduled email to lead auditor:", auditorEmail);

    await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: auditorEmail,
      subject: "📋 Audit Scheduled — Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">

          <p>Dear ${auditorName},</p>

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


          <p style="margin-top: 32px;">
            Best regards,<br />
            <strong>Halal and Haram Distinction Development Initiative Team</strong>
          </p>

        </div>
      `,
    });

    console.log("📧 Audit scheduled email sent to lead auditor!");
  } catch (error) {
    console.error("❌ Failed to send audit scheduled email:", error);
  }
};

module.exports = sendAuditScheduledEmail;
