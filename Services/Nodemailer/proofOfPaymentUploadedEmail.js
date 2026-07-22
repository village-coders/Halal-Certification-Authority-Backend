const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to accountants, super admins, and application officers when a proof of payment is uploaded.
 * 
 * @param {string[]} toEmails - Array of email addresses to send the notification to.
 * @param {string} companyName - The name of the company or user who uploaded the proof.
 * @param {string} invoiceNumber - The invoice number associated with the payment.
 * @param {string} proofUrl - The URL to view/download the proof of payment.
 */
const proofOfPaymentUploadedEmail = async (
  toEmails,
  companyName,
  invoiceNumber,
  proofUrl
) => {
  try {
    if (!toEmails || toEmails.length === 0) {
      console.log("No accountant or super admin emails found to send proof of payment notification.");
      return;
    }

    console.log(`📤 Sending proof of payment uploaded email to ${toEmails.length} admins...`);

    const adminPortalUrl = `${process.env.ADMIN_DOMAIN || 'http://localhost:5174'}/invoices`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: toEmails,
      subject: `💰 Proof of Payment Uploaded — ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Hello <strong>Admin</strong>,</p>

            <p>
              This is an automated notification to inform you that <strong>${companyName}</strong> has uploaded a proof of payment for invoice <strong>${invoiceNumber}</strong>.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; width: 35%;">
                  Company Name
                </td>
                <td style="padding: 10px; border: 1px solid #ddd;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">
                  Invoice Number
                </td>
                <td style="padding: 10px; border: 1px solid #ddd;">${invoiceNumber}</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${proofUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; margin-bottom: 10px;">
                View Proof of Payment
              </a>
              <br />
              <a href="${adminPortalUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">
                Go to Admin Dashboard
              </a>
            </div>

            <p style="margin-top: 32px; margin-bottom: 0;">
              Best regards,<br />
              <strong>Halal & Haram Distinction Development Initiative (HDI) System</strong>
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
    console.log("📧 Proof of payment email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending proof of payment email:", error);
  }
};

module.exports = proofOfPaymentUploadedEmail;
