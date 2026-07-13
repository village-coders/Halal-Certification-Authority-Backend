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

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Payment Confirmation – Invoice Paid Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          
          <p>Dear ${companyName},</p>

          <p>
            We are pleased to confirm that we have received your payment 
            for the invoice related to <strong>${productName}</strong>.
          </p>

          <p>
            Below are the payment details:
          </p>

          <ul style="margin: 16px 0;">
            <li><strong>Invoice Number:</strong> ${invoiceNumber}</li>
            <li><strong>Amount Paid:</strong> ${amountPaid}</li>
            <li><strong>Status:</strong> Paid</li>
          </ul>

          <p style="margin: 24px 0;">
            <span style="display:inline-block;padding:12px 24px;background:#00853b;color:#fff;border-radius:5px;">
              Invoice Status: Paid
            </span>
          </p>

          <p>
            Thank you for your prompt payment. Your certification process
            will now proceed accordingly.
          </p>

          <p>
            If you have any questions regarding this invoice or require
            further assistance, please do not hesitate to contact our support team.
          </p>

          <p style="margin-top: 32px;">
            Best regards,<br />
            <strong>Halal and Haram Distinction Development Initiative Team</strong>
          </p>

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