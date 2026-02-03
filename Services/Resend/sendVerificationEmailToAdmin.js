const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationEmailToAdmin = async (email, adminFirstName, token) => {
  try {
    console.log("📤 Sending admin verification email to:", email);

    const verificationLink = `${process.env.CLIENT_DOMAIN}/admin/verify/${token}`;

    const data = await resend.emails.send({
      from: "Halal & Haram Distinction Dev Initiative <onboarding@theyoungpioneers.com>",
      to: email,
      subject: "🔐 Verify Your Admin Email Address",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 24px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
            
            <h2 style="color: #111827;">Hello ${adminFirstName},</h2>

            <p>
              You have been registered as an <strong>Administrator</strong> for the
              <strong>Halal and Haram Distinction Development Initiative</strong>.
            </p>

            <p>
              To complete your setup and activate your admin account, please verify
              your email address by clicking the button below.
            </p>

            <div style="margin: 32px 0; text-align: center;">
              <a href="${verificationLink}"
                 style="display:inline-block;padding:14px 28px;background:#16a34a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
                Verify Admin Email
              </a>
            </div>

            <p>
              If you did not request or expect this email, you can safely ignore it.
              The link will expire for security reasons.
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />

            <p style="font-size: 14px; color: #6b7280;">
              — Halal and Haram Distinction Development Initiative Team
            </p>
          </div>
        </div>
      `,
    });

    console.log("📧 Admin verification email sent successfully!");
    console.log("Message ID:", data.id);
  } catch (error) {
    console.error("❌ Failed to send admin verification email:", error);
  }
};

module.exports = sendVerificationEmailToAdmin;
