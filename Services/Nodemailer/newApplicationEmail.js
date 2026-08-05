const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

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

    const adminPortalUrl = `${process.env.ADMIN_DOMAIN || 'http://localhost:5174'}/applications`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";
    const isRenewal = category === "Renewal Application";
    const isAdOn = category === "Ad-On Application" || category === "Ad-On";
    const subject = isRenewal
      ? `🔄 Renewal Application Submitted — ${applicationNumber}`
      : isAdOn
      ? `➕ Ad-On Application Submitted — ${applicationNumber}`
      : `📋 New Application Submitted — ${applicationNumber}`;

    const badgeColor = isRenewal ? "#1e40af" : isAdOn ? "#8b5cf6" : "#00853b";
    const badgeLabel = isRenewal ? "Renewal Application" : isAdOn ? "Ad-On Application" : "New Application";

    await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: toEmails,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0;">

            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Hello <strong>Admin</strong>,</p>

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

            <div style="text-align: center; margin: 32px 0;">
              <a href="${adminPortalUrl}"
                 style="display:inline-block; padding: 14px 28px; background-color: #00853b; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Review Application
              </a>
            </div>

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

    console.log("📧 New application admin notification email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending new application admin email:", error);
  }
};

module.exports = newApplicationEmail;
