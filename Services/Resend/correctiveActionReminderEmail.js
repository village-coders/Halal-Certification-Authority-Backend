const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendCorrectiveActionReminderEmail = async (email, companyName, pendingIssues) => {
    try {
        console.log("📤 Sending corrective action reminder to:", email);

        const issuesList = pendingIssues.map(p => `<li>${p.issue}</li>`).join("");

        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: email,
            subject: "⚠️ REMINDER: Corrective Actions Required - Halal And Haram Distinction Initiative Development",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #d97706;">Corrective Action Reminder</h2>
                    </div>
                    <div style="color: #333; line-height: 1.6;">
                        <p>Dear ${companyName},</p>
                        <p>This is a reminder that there are pending corrective actions required for your audit.</p>
                        <p><strong>Pending Issues:</strong></p>
                        <ul>
                            ${issuesList}
                        </ul>
                        <p>Please address these issues promptly to proceed with your certification.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.CLIENT_DOMAIN}/audits" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Audit Details</a>
                        </div>
                        <p>Best regards,<br/>Halal And Haram Distinction Initiative Development</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                    <div style="text-align: center; color: #888; font-size: 12px;">
                        <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log("📧 Corrective action reminder sent successfully!");
        return data;
    } catch (error) {
        console.error("Error sending reminder email:", error);
        throw new Error("Failed to send reminder email");
    }
};

module.exports = sendCorrectiveActionReminderEmail;
