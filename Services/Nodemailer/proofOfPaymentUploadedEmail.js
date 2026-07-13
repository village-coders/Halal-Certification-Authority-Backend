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

    const adminPortalUrl = `${process.env.admin_domain || 'http://localhost:5174'}/invoices`;

    await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: toEmails,
      subject: `💰 Proof of Payment Uploaded — ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          <h2 style="color: #00853b; border-bottom: 2px solid #00853b; padding-bottom: 10px;">
            Proof of Payment Received
          </h2>

          <p>Hello Admin,</p>

          <p>
            This is an automated notification to inform you that <strong>${companyName}</strong> has uploaded a proof of payment for invoice <strong>${invoiceNumber}</strong>.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold; width: 30%;">
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

          <p style="margin-top: 24px;">
            <a href="${proofUrl}" style="display:inline-block;padding:10px 20px;background:#00853b;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">
              View Proof of Payment
            </a>
          </p>

          <p style="margin-top: 15px;">
            Please log in to the admin portal to review and approve the payment.
          </p>
          
          <p>
            <a href="${adminPortalUrl}" style="display:inline-block;padding:10px 20px;background:#1e40af;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">
              Go to Admin Dashboard
            </a>
          </p>

          <p style="margin-top: 32px; font-size: 14px; color: #666;">
            Best regards,<br />
            <strong>Halal and Haram Distinction Development Initiative System</strong>
          </p>
        </div>
      `,
    });
    console.log("📧 Proof of payment email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending proof of payment email:", error);
  }
};

module.exports = proofOfPaymentUploadedEmail;
