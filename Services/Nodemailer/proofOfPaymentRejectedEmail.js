const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client when their proof of payment has been rejected.
 *
 * @param {string|string[]} email - Client's email address(es).
 * @param {string} clientName - Name of the client/company.
 * @param {string} invoiceNumber - The invoice number.
 * @param {string} reason - The reason why proof of payment was rejected.
 */
const proofOfPaymentRejectedEmail = async (email, clientName, invoiceNumber, reason) => {
  try {
    console.log("📤 Sending proof of payment rejected email to:", email);

    const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/invoices`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `⚠️ Action Required: Proof of Payment Rejected — ${invoiceNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal &amp; Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${clientName}</strong>,</p>

            <p>
              We have reviewed the proof of payment submitted for invoice <strong>${invoiceNumber}</strong>. Unfortunately, the submitted documentation could not be verified and has been <strong>rejected</strong>.
            </p>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #991b1b;">Rejection Reason:</p>
              <p style="margin: 6px 0 0 0; color: #b91c1c; font-size: 15px;">
                ${reason || 'The uploaded document did not meet verification criteria. Please re-upload a clear and valid proof of payment.'}
              </p>
            </div>

            <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #166534;">Next Steps:</p>
              <p style="margin: 6px 0 0 0; color: #15803d;">
                Please log in to your HDI Client Portal, review the rejection feedback, and upload a valid, clear proof of payment (such as an official bank transfer receipt or bank deposit slip).
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Re-upload Proof of Payment
              </a>
            </div>

            <p>
              If you have any questions or require clarification, please feel free to reach out to <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a>.
            </p>

            <p style="margin-top: 32px; margin-bottom: 0;">
              Kind regards,<br />
              <strong>The Halal Team</strong><br />
              Halal &amp; Haram Distinction Development Initiative (HDI).
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
            <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
              <p style="margin: 4px 0; font-weight: bold; color: #333;">The Halal &amp; Haram Distinction Development Initiative (HDI) Team</p>
              <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
              <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
            </footer>
          </div>
        </div>
      `,
    });

    console.log("📧 Proof of payment rejected email sent successfully!");
    return data;
  } catch (error) {
    console.error("❌ Error sending proof of payment rejected email:", error);
    return null;
  }
};

module.exports = proofOfPaymentRejectedEmail;
