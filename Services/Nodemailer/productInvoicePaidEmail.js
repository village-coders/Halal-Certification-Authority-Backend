const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendPaidInvoiceEmail = async (
  email,
  companyName,
  productName,
  invoiceNumber,
  amountPaid
) => {
  try {
    console.log("📤 Sending paid invoice email to:", email);

    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const data = await transporter.sendMail({
      from: `HDI <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Payment Confirmation — Invoice ${invoiceNumber} Paid Successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="HDI Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">HDI</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${companyName}</strong>,</p>

            <p>The Halal Team wishes you continued success in your business endeavors.</p>

            <p>
              We are pleased to confirm that we have received your payment 
              for the invoice related to <strong>${productName}</strong>.
            </p>

            <div style="background-color: #f0fdf4; border-left: 4px solid #00853b; padding: 16px; margin: 24px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #166534; font-size: 17px;">Payment Confirmation</p>
              <ul style="margin: 8px 0 0 0; color: #15803d; padding-left: 20px; list-style: none;">
                <li style="margin-bottom: 4px;"><strong>Invoice Number:</strong> ${invoiceNumber}</li>
                <li style="margin-bottom: 4px;"><strong>Amount Paid:</strong> ${amountPaid}</li>
                <li><strong>Status:</strong> <span style="font-weight: bold; color: #16a34a;">✓ Paid</span></li>
              </ul>
            </div>

            <p>
              Thank you for your prompt payment. Your certification process will now proceed accordingly.
            </p>

            <p>
              If you have any questions regarding this invoice or require further assistance, please do not hesitate to contact <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none; font-weight: bold;">support@halalcert.com.ng</a> for support.
            </p>

            <p style="margin-top: 32px; margin-bottom: 0;">
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

    console.log("📧 Paid invoice email sent!");
    console.log("Message ID:", data.messageId);
  } catch (error) {
    console.error("❌ Failed to send paid invoice email:", error);
  }
};

module.exports = sendPaidInvoiceEmail;