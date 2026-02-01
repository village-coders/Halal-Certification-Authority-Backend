const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendProductApprovalEmail = async (email, companyName, productName) => {
  try {
    console.log("📤 Sending product approval email to:", email);

    const data = await resend.emails.send({
      from: "Halal Food Certification <onboarding@theyoungpioneers.com>",
      to: email,
      subject: "🎉 Product Approved – Halal Certification",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          
          <p>Dear ${companyName},</p>

          <p>
            We are pleased to inform you that your product,
            <strong>${productName}</strong>, has been <strong>successfully approved</strong>
            by the Halal Food Certification Authority.
          </p>

          <p>
            This approval confirms that your product meets our halal standards and requirements.
            You may now proceed to the application stage.
          </p>

          <p style="margin: 24px 0;">
            <span style="display:inline-block;padding:12px 24px;background:#00853b;color:#fff;border-radius:5px;">
              Product Status: Approved
            </span>
          </p>

          <p>
            Our team will notify you once the halal certificate has been generated, or if any
            further information is required.
          </p>

          <p>
            If you have any questions, feel free to contact our support team.
          </p>

          <p style="margin-top: 32px;">
            Best regards,<br />
            <strong>Halal Food Certification Team</strong>
          </p>

        </div>
      `,
    });

    console.log("📧 Product approval email sent!");
    console.log("Message ID:", data.id);
  } catch (error) {
    console.error("❌ Failed to send product approval email:", error);
  }
};

module.exports = sendProductApprovalEmail;
