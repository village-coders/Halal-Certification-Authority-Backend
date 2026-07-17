const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



const sendProductApprovalEmail = async (email, companyName, productName) => {
  try {
    console.log("📤 Sending product acknowledgment email to:", email);

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Product Acknowledged!",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          
          <p>Dear ${companyName},</p>

          <p>
            We are pleased to inform you that your product,
            <strong>${productName}</strong>, has been <strong>successfully acknowledged</strong>
            by the Halal and Haram Distinction Development Initiative.
          </p>

          <p>
            This acknowledgment confirms that your product meets our halal standards and requirements.
            You may now proceed to continue with the application.
          </p>

          <p style="margin: 24px 0;">
            <span style="display:inline-block;padding:12px 24px;background:#00853b;color:#fff;border-radius:5px;">
              Product Status: Acknowledged
            </span>
          </p>

          <p>
            If you have any questions, feel free to contact our support team.
          </p>

          <p style="margin-top: 32px;">
            Best regards,<br />
            <strong>Halal and Haram Distinction Development Initiative Team</strong>
          </p>

        </div>
      `,
    });

    console.log("📧 Product acknowledgment email sent!");
    console.log("Message ID:", data.messageId);
  } catch (error) {
    console.error("❌ Failed to send product acknowledgment email:", error);
  }
};

module.exports = sendProductApprovalEmail;
