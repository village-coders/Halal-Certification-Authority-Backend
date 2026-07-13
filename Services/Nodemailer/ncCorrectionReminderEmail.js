const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



const sendNcCorrectionReminderEmail = async (email, companyName) => {
    try {
        console.log("📤 Sending NC correction reminder to:", email);

        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "⚠️ ACTION REQUIRED: Please Submit Your NC Correction - Halal Certification",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="background-color: #f59e0b; padding: 16px; border-radius: 8px 8px 0 0;">
                            <h2 style="color: white; margin: 0;">⚠️ NC Correction Submission Required</h2>
                        </div>
                    </div>
                    <div style="color: #333; line-height: 1.8; padding: 10px 0;">
                        <p>Dear <strong>${companyName}</strong>,</p>
                        <p>This is a reminder that your <strong>Non-Conformance (NC) Correction</strong> document is still pending submission in our portal.</p>
                        <p>Our audit team has identified findings during the audit session that require corrective actions from your end. Please upload the corrected action documents as soon as possible to continue with your Halal Certification process.</p>
                        <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 16px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-weight: bold;">⚠️ Please note:</p>
                            <p style="margin: 8px 0 0 0; color: #78350f;">Failure to submit your NC correction documents may delay or affect the outcome of your certification application.</p>
                        </div>
                        <p>To submit your documents, please log in to the portal and navigate to <strong>Audits</strong> → <strong>Upload NC Correction</strong>.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_DOMAIN}/audits" style="background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">Go to My Audits</a>
                        </div>
                        <p>If you have already submitted or have any questions, please contact our team immediately.</p>
                        <p>Best regards,<br/><strong>Halal And Haram Distinction Initiative Development</strong></p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log("📧 NC correction reminder sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending NC correction reminder email:", error);
        throw new Error("Failed to send NC correction reminder email");
    }
};

module.exports = sendNcCorrectionReminderEmail;
