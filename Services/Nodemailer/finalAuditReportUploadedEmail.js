const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client when the Final Audit Report is uploaded by the lead auditor.
 *
 * @param {string} email - Client's email address.
 * @param {string} clientName - Name of the client/company.
 * @param {string} applicationId - Application ID/Number.
 * @param {string|null} auditReportUrl - URL to download the final audit report if available.
 */
const finalAuditReportUploadedEmail = async (email, clientName, applicationId, auditReportUrl = null) => {
  try {
    console.log("📤 Sending Final Audit Report Uploaded email to:", email);

    const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/track-application/${applicationId}`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    let reportAttachmentText = "";
    if (auditReportUrl) {
      reportAttachmentText = `
        <p style="margin-top: 16px;">
          You can download a copy of the Final Audit Report here: 
          <a href="${auditReportUrl}" style="color: #00853b; font-weight: bold; text-decoration: underline;">Download Final Audit Report</a>
        </p>
      `;
    }

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📄 Final Audit Report Uploaded — Application ${applicationId}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${clientName}</strong>,</p>

            <p>The Halal Team wishes you continued success in your business endeavors.</p>

            <p>
              We are writing to inform you that the Final Audit Report for your Halal Certification application <strong>${applicationId}</strong> has been successfully uploaded.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #166534; font-size: 17px;">Final Audit Report Uploaded</p>
              <p style="margin: 6px 0 0 0; color: #15803d;">
                The Lead Auditor has submitted the comprehensive Final Audit Report following your audit verification.
              </p>
              <p style="margin: 8px 0 0 0; color: #15803d; font-weight: bold;">
                Next Step: <span style="font-weight: normal;">Your application and final audit findings are now prepared for submission to the Shari'a Board for final endorsement.</span>
              </p>
            </div>

            <p>
              You can log in to your HDI Portal dashboard to view the audit report details and track your application progress.
            </p>

            ${reportAttachmentText}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Report & Progress
              </a>
            </div>

            <p>
              If you have any questions or require further assistance, please do not hesitate to reach out to <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.
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

    console.log("📧 Final Audit Report Uploaded email sent successfully!");
    console.log("Message ID:", data.messageId);
    return data;
  } catch (error) {
    console.error("❌ Error sending Final Audit Report Uploaded email:", error);
    return null;
  }
};

module.exports = finalAuditReportUploadedEmail;
