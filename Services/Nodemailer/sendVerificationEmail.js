const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



const sendVerificationEmail = async (email, userFirstName, token) => {
  try {
    console.log("📤 Sending verification email to:", email);

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Verify Your Email for Halal and Haram Distinction Development Initiative",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          <p>Dear ${userFirstName},</p>

          <p>
            Thank you for registering with <strong>Halal and Haram Distinction Development Initiative</strong>.
          </p>

          <p>
              Please confirm your email address by clicking the button below:
          </p>

          <p>
            <a href="${process.env.client_domain}/verify/${token}"
              style="display:inline-block;padding:12px 24px;background:#28a745;color:#fff;text-decoration:none;border-radius:5px;">
              Verify My Email
            </a>
          </p>

          <p style="font-size: 14px; color: #666; margin-top: 24px;">
            If the button above does not work, you can copy and paste the following link into your browser:<br/><br/>
            <a href="${process.env.client_domain}/verify/${token}" style="color: #0056b3; word-break: break-all;">
              ${process.env.client_domain}/verify/${token}
            </a>
          </p>

          <p>The Halal and Haram Distinction Development Initiative Team</p>
        </div>
      `,
    });
    console.log("📧 Email sent successfully!");
    console.log("Message ID:", data.messageId); // useful for tracking
  } catch (error) {
    console.log(error);    
  }
};

module.exports = sendVerificationEmail;
