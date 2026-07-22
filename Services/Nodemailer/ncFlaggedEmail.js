const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client when an NC report is uploaded.
 *
 * @param {string} email - Client's email address.
 * @param {string} clientName - Name of the client/company.
 * @param {string} applicationId - Application ID/Number.
 * @param {string|null} ncReportUrl - URL to the NC report / CAPA format file if available.
 */
const ncFlaggedEmail = async (email, clientName, applicationId, ncReportUrl = null) => {
  try {
    console.log("📤 Sending NC Flagged email to:", email);

    const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/track-application/${applicationId}`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const attachments = [];
    let fileAttachmentText = "";

    if (ncReportUrl) {
      fileAttachmentText = `
        <p style="margin-top: 16px;">
          Kindly find attached a format of CAPA report / NC Report: 
          <a href="${ncReportUrl}" style="color: #00853b; font-weight: bold; text-decoration: underline;">Download Report</a>
        </p>
      `;
    }

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Non-Conformity (NC) Report Available — Application ${applicationId}`,
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
              We are writing to provide you with an update on your Halal Certification application <strong>${applicationId}</strong>.
            </p>

            <div style="background-color: #fffbebfb; border-left: 4px solid #d97706; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 17px;">Non-Conformity (NC) Report Available</p>
              <p style="margin: 6px 0 0 0; color: #b45309;">
                A Non-Conformity (NC) Report has been uploaded following your audit. To proceed with your certification, you are required to submit a Corrective Action Plan (CAPA) addressing the identified non-conformities.
              </p>
              <p style="margin: 8px 0 0 0; color: #b45309; font-weight: bold;">
                Next Step: <span style="font-weight: normal;">Please log in to your HDI Portal dashboard to review the NC Report and upload your CAPA. Once your submission is received, our audit team will review it and, upon satisfactory verification, proceed to the next stage of your certification process.</span>
              </p>
            </div>

            <p>
              You can track the progress of your application and view updates through your dashboard.
            </p>

            ${fileAttachmentText}

            <div style="text-align: center; margin: 32px 0;">
              <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Progress
              </a>
            </div>

            <p>
              If you have any questions or require assistance, please do not hesitate to contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.
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

    console.log("📧 NC Flagged email sent successfully!");
    console.log("Message ID:", data.messageId);
    return data;
  } catch (error) {
    console.error("❌ Error sending NC Flagged email:", error);
    return null;
  }
};

module.exports = ncFlaggedEmail;
