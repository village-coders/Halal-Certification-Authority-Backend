const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendCertificateIssuedEmail = async (
  email,
  companyName,
  applicationNumber,
  certificateNumber
) => {
  try {
    console.log("📤 Sending certificate issued email to:", email);

    const data = await resend.emails.send({
      from: "Halal and Haram Distinction Development Initiative <onboarding@theyoungpioneers.com>",
      to: email,
      subject: "🎉 Halal Certificate Issued Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          
          <p>Dear ${companyName},</p>

          <p>
            We are pleased to inform you that the halal certificate for your application
            <strong>${applicationNumber}</strong> has been <strong>successfully issued</strong>
            by the Halal and Haram Distinction Development Initiative.
          </p>

          <p>
            <strong>Certificate Number:</strong> ${certificateNumber}
          </p>

          <p>
            This certificate confirms that your product complies with the required halal
            standards and is now officially certified.
          </p>

          <p style="margin: 24px 0;">
            <span style="display:inline-block;padding:12px 24px;background:#00853b;color:#fff;border-radius:5px;">
              Certificate Status: Active
            </span>
          </p>

          <p>
            You may log in to your dashboard to view or download your certificate.
          </p>

          <p>
            If you have any questions or require further assistance, please do not hesitate
            to contact our support team.
          </p>

          <p style="margin-top: 32px;">
            Best regards,<br />
            <strong>Halal and Haram Distinction Development Initiative Team</strong>
          </p>

        </div>
      `,
    });

    console.log("📧 Certificate issued email sent!");
    console.log("Message ID:", data.id);
  } catch (error) {
    console.error("❌ Failed to send certificate issued email:", error);
  }
};

module.exports = sendCertificateIssuedEmail;
