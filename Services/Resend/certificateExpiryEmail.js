const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const certificateExpiryEmail = async (email, name, certificateNumber, expiryDate) => {
    try {
        console.log("📤 Sending certificate expiry email to:", email);

        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: email,
            subject: "⚠️ Certificate Expiring in 3 Months - Halal Certification Authority",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00853b;">Halal Certification Authority</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${name},</p>
                        <p>This is an automated reminder that your Halal Certificate (<strong>${certificateNumber}</strong>) will expire in 3 months on <strong>${expiryDate}</strong>.</p>
                        <p>To avoid any disruption to your certification and operations, please sign in to your dashboard and submit a renewal application at your earliest convenience.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_DOMAIN}/applications" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Renew Certificate</a>
                        </div>
                        <p>If you have any questions or require assistance, please contact us.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal Certification Authority. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log("📧 Certificate expiry email sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending certificate expiry email:", error);
        throw new Error("Failed to send certificate expiry email");
    }
};

module.exports = certificateExpiryEmail;
