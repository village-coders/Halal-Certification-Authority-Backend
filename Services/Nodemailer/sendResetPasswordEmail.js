const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendResetPasswordEmail = async (email, name, token, isAdmin = false) => {
    const baseUrl = isAdmin ? process.env.ADMIN_DOMAIN : process.env.client_domain;
    const resetUrl = `${baseUrl}/reset-password/${token}`;
    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    try {
        console.log("📤 Sending password reset email to:", email);

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔐 Password Reset Request — Halal & Haram Distinction Development Initiative",
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Dear <strong>${name}</strong>,</p>

                    <p>
                      You are receiving this email because you (or someone else) requested a password reset for your account on the Halal & Haram Distinction Development Initiative (HDI) platform.
                    </p>

                    <p>Please click the button below to reset your password:</p>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" style="background-color: #00853b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
                    </div>

                    <p style="font-size: 14px; color: #666;">
                      If you did not request this, please ignore this email and your password will remain unchanged. This link will expire in 1 hour for security reasons.
                    </p>

                    <p style="margin-top: 32px; margin-bottom: 0;">
                      Best regards,<br />
                      <strong>The Halal Team</strong><br />
                      Halal & Haram Distinction Development Initiative (HDI)
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
                    <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
                      <p style="margin: 4px 0; font-weight: bold; color: #333;">The Halal & Haram Distinction Development Initiative (HDI) Team</p>
                      <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
                      <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
                    </footer>
                  </div>
                </div>
            `,
        });
        console.log("📧 Reset email sent successfully!");
        console.log("Message ID:", data.messageId);
    } catch (error) {
        console.error("Error sending reset password email:", error);
        throw new Error("Failed to send reset password email");
    }
};

module.exports = sendResetPasswordEmail;
