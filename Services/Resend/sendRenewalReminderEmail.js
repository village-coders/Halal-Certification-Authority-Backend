const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendRenewalReminderEmail = async (recipientEmail, companyName, certificateNumber, expiryDate, isExpired) => {
    try {
        const statusText = isExpired ? "has expired" : "is expiring soon";
        const actionText = isExpired ? "renew it immediately" : "renew it before it expires";
        
        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: recipientEmail,
            subject: `Action Required: Certificate ${certificateNumber} ${statusText}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e293b; margin-top: 0;">Certificate Renewal Reminder</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Hello <strong>${companyName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        This is an official reminder that your Halal Certificate <strong style="color: #b91c1c;">${certificateNumber}</strong> ${statusText}.
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Certificate Number:</strong> ${certificateNumber}</p>
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Expiry Date:</strong> <span style="color: #b91c1c;">${new Date(expiryDate).toLocaleDateString()}</span></p>
                        <p style="margin: 0; color: #334155;"><strong>Status:</strong> ${isExpired ? "Expired" : "Expiring Soon"}</p>
                    </div>
                    <p style="color: #475569; font-size: 15px;">
                        To maintain your certification status, please log in to your dashboard and initiate a renewal application to ${actionText}.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        &copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.
                    </p>
                </div>
            `,
        });

        console.log("Renewal Reminder Email sent successfully");
        return data;
    } catch (error) {
        console.error("Error sending renewal reminder email: ", error);
        throw error;
    }
};

module.exports = {
    sendRenewalReminderEmail
};
