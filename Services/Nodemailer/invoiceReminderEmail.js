const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client reminding them to pay their Halal Certification invoice.
 *
 * @param {string|string[]} recipient - Client email or array of emails.
 * @param {string} clientName - Name of the client/company.
 * @param {string} applicationId - Application reference number.
 * @param {string} invoiceNumber - Invoice number.
 */
const sendInvoiceReminderEmail = async (recipient, clientName, applicationId, invoiceNumber) => {
  try {
    const recipients = Array.isArray(recipient) ? recipient.join(", ") : recipient;
    console.log("📤 Sending invoice payment reminder email to:", recipients);

    const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/invoices`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const data = await transporter.sendMail({
      from: `HDI <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `⚠️ Reminder: Halal Certification Invoice Payment — ${invoiceNumber || applicationId || 'HDI'}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="HDI Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">HDI</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${clientName}</strong>,</p>

            <p>The Halal Team wishes you continued success in your business endeavors.</p>

            <p>
              This is a <strong>gentle reminder</strong> that your Halal Certification invoice has been issued. Kindly make payment promptly to enable us to schedule your audit.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #166534;">Next Step:</p>
              <p style="margin: 6px 0 0 0; color: #15803d;">
                Please log in to your HDI Portal dashboard to view your invoice and upload your proof of payment. <em>If you have already made payment, kindly upload your payment receipt through the portal.</em>
              </p>
              <p style="margin: 8px 0 0 0; color: #15803d;">
                You can also track the progress of your application through your dashboard.
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                View Invoice &amp; Track Progress
              </a>
            </div>

            <p>
              For further assistance, please contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> or +234 803 209 9441
            </p>

            <p style="margin-top: 24px;">
              Thank you for your cooperation.
            </p>

            <p style="margin-top: 28px; margin-bottom: 0;">
              Best regards,<br />
              <strong>The Halal Team</strong><br />
              HDI
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
            <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
              <p style="margin: 4px 0; font-weight: bold; color: #333;">The HDI Team</p>
              <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
              <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
            </footer>
          </div>
        </div>
      `,
    });

    console.log("📧 Invoice payment reminder email sent successfully!");
    return data;
  } catch (error) {
    console.error("❌ Error sending invoice payment reminder email:", error);
    return null;
  }
};

module.exports = sendInvoiceReminderEmail;
