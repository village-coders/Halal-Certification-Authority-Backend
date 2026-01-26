const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmail = async (email, userFirstName, token) => {
  try {
    console.log("📤 Sending verification email to:", email);

    const data = await resend.emails.send({
      from: "Halal Food Certification <onboarding@theyoungpioneers.com>",
      to: email,
      subject: "✅ Verify Your Email for Halal Food Certification",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          <p>Dear ${userFirstName},</p>

          <p>
            Thank you for applying with <strong>Halal Food Certification</strong>.
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

          <p>The Halal Food Certification Team</p>
        </div>
      `,
    });
    console.log("📧 Email sent successfully!");
    console.log("Message ID:", data.id); // useful for tracking
  } catch (error) {
    console.log(error);    
  }
};

module.exports = sendVerificationEmail;
