const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendVerificationEmailToAdmin = async (email, adminFirstName, token) => {
  try {
    console.log("📤 Sending admin verification email to:", email);

    const verificationLink = `${process.env.ADMIN_DOMAIN}/verify/${token}`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Verify Your Admin Email Address — Halal & Haram Distinction Development Initiative",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 24px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 10px; border: 1px solid #e0e0e0;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Hello <strong>${adminFirstName}</strong>,</p>

            <p>
              You have been registered as an <strong>Administrator</strong> for the
              <strong>Halal & Haram Distinction Development Initiative (HDI)</strong>.
            </p>

            <p>
              To complete your setup and activate your admin account, please verify
              your email address by clicking the button below.
            </p>

            <div style="margin: 32px 0; text-align: center;">
              <a href="${verificationLink}"
                 style="display:inline-block;padding:14px 28px;background:#00853b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
                Verify Admin Email
              </a>
            </div>

            <p style="font-size: 14px; color: #666;">
              If you did not request or expect this email, you can safely ignore it.
              The link will expire for security reasons.
            </p>

            <p style="margin-top: 32px; margin-bottom: 0;">
              Best regards,<br />
              <strong>The Halal Team</strong><br />
              Halal & Haram Distinction Development Initiative (HDI)
            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0 20px 0;" />
            <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
              <p style="margin: 4px 0; font-weight: bold; color: #333;">The Halal & Haram Distinction Development Initiative (HDI) Team</p>
              <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
              <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
            </footer>
          </div>
        </div>
      `,
    });

    console.log("📧 Admin verification email sent successfully!");
    console.log("Message ID:", data.messageId);
  } catch (error) {
    console.error("❌ Failed to send admin verification email:");
    console.error(error?.response || error);
  }
};

module.exports = sendVerificationEmailToAdmin;
