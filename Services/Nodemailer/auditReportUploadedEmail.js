const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



const sendAuditReportUploadedEmail = async (email, companyName, applicationId) => {
    try {
        console.log("📤 Sending audit report upload notification to:", email);

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "📎 Audit Report Available - Halal And Haram Distinction Initiative Development",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #00853b;">Halal And Haram Distinction Initiative Development</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${companyName},</p>
                        <p>An audit report has been uploaded for your application <strong>${applicationId}</strong>.</p>
                        <p>Please log in to your portal to view the report and take any necessary actions.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_DOMAIN}/dashboard" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
                        </div>
                        <p>If you have any questions, please feel free to contact us.</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log("📧 Audit report notification sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending audit report email:", error);
        throw new Error("Failed to send audit report email");
    }
};

module.exports = sendAuditReportUploadedEmail;
