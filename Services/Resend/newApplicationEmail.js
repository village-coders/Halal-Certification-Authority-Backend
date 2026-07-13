const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email to ALL admins and super admins when a client submits a new application or renewal.
 *
 * @param {string[]} toEmails - Array of admin email addresses.
 * @param {string} companyName - The name of the company that submitted the application.
 * @param {string} applicationNumber - The generated application number.
 * @param {string} category - The application category (e.g., "New Application", "Renewal Application").
 */
const newApplicationEmail = async (toEmails, companyName, applicationNumber, category) => {
  try {
    if (!toEmails || toEmails.length === 0) {
      console.log("No admin emails found to notify about new application.");
      return;
    }

    console.log(`📤 Sending new application notification to ${toEmails.length} admin(s)...`);

    const adminPortalUrl = `${process.env.admin_domain || 'http://localhost:5174'}/applications`;
    const isRenewal = category === "Renewal Application";
    const subject = isRenewal
      ? `🔄 Renewal Application Submitted — ${applicationNumber}`
      : `📋 New Application Submitted — ${applicationNumber}`;

    const badgeColor = isRenewal ? "#1e40af" : "#00853b";
    const badgeLabel = isRenewal ? "Renewal Application" : "New Application";

    await resend.emails.send({
      from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
      to: toEmails,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 620px; margin: auto; background: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e5e7eb;">

            <h2 style="color: #111827; margin-top: 0;">
              ${isRenewal ? '🔄 Renewal Application Submitted' : '📋 New Application Submitted'}
            </h2>

            <p>Hello Admin,</p>

            <p>
              A client has submitted a <strong>${badgeLabel}</strong> and is awaiting your review.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9f9f9; font-weight: bold; width: 35%;">Company Name</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9f9f9; font-weight: bold;">Application Number</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${applicationNumber}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9f9f9; font-weight: bold;">Category</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">
                  <span style="display:inline-block; padding: 3px 10px; background-color: ${badgeColor}; color: #fff; border-radius: 4px; font-size: 13px; font-weight: bold;">
                    ${badgeLabel}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; background-color: #f9f9f9; font-weight: bold;">Submitted At</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })} (WAT)</td>
              </tr>
            </table>

            <p style="margin-top: 24px;">
              Please log in to the admin portal to review the application and take appropriate action.
            </p>

            <div style="margin-top: 24px;">
              <a href="${adminPortalUrl}"
                 style="display:inline-block; padding: 12px 24px; background-color: #00853b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Review Application
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />

            <p style="font-size: 14px; color: #6b7280;">
              — Halal and Haram Distinction and Development Initiative System
            </p>
          </div>
        </div>
      `,
    });

    console.log("📧 New application admin notification email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending new application admin email:", error);
  }
};

module.exports = newApplicationEmail;
