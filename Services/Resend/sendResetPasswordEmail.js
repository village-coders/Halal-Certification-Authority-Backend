const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendResetPasswordEmail = async (email, name, token, isAdmin = false) => {
    const baseUrl = isAdmin ? process.env.ADMIN_DOMAIN : process.env.client_domain;
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    try {
        console.log("📤 Sending password reset email to:", email);

        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: email,
            subject: "🔐 Password Reset Request - Halal and Haram Distinction Development Initiative",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00853b;">Halal And Haram Distinction Initiative Development</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${name},</p>
                        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
                        <p>Please click on the following button to complete the process:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                        <p>This link will expire in 1 hour.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log("📧 Reset email sent successfully!");
        console.log("Message ID:", data.id);
    } catch (error) {
        console.error("Error sending reset password email:", error);
        throw new Error("Failed to send reset password email");
    }
};

module.exports = sendResetPasswordEmail;
