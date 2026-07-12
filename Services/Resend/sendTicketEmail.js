const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendNewTicketAdminEmail = async (adminEmail, ticket, userName) => {
    try {
        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: adminEmail,
            subject: `New Support Ticket: ${ticket.ticketNumber} - ${ticket.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e293b; margin-top: 0;">New Support Ticket Created</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        A new support ticket has been submitted by <strong>${userName}</strong>.
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Ticket Number:</strong> <span style="color: #00853b;">${ticket.ticketNumber}</span></p>
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Title:</strong> ${ticket.title}</p>
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Category:</strong> ${ticket.category}</p>
                        <p style="margin: 0 0 10px 0; color: #334155;"><strong>Priority:</strong> ${ticket.priority}</p>
                        <p style="margin: 0; color: #334155;"><strong>Description:</strong><br/> ${ticket.description}</p>
                    </div>
                    <p style="color: #475569; font-size: 15px;">
                        Please log in to the admin dashboard to review and respond to this ticket.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        &copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.
                    </p>
                </div>
            `,
        });

        console.log("New Ticket Admin Email sent successfully");
        return data;
    } catch (error) {
        console.error("Error sending new ticket admin email: ", error);
    }
};

const sendTicketReplyEmail = async (recipientEmail, recipientName, ticket, replyContent, senderName) => {
    try {
        const data = await resend.emails.send({
            from: "Halal and Haram Distinction and Development Initiative <support@theyoungpioneers.com>",
            to: recipientEmail,
            subject: `New Reply to Ticket: ${ticket.ticketNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e293b; margin-top: 0;">New Ticket Reply</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        Hello <strong>${recipientName}</strong>,
                    </p>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">
                        You have received a new reply on ticket <strong style="color: #00853b;">${ticket.ticketNumber}</strong> from <strong>${senderName}</strong>.
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #334155; white-space: pre-wrap;">${replyContent}</p>
                    </div>
                    <p style="color: #475569; font-size: 15px;">
                        Please log in to your dashboard to view the full conversation and respond if necessary.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        &copy; ${new Date().getFullYear()} Halal And Haram Distinction Initiative Development. All rights reserved.
                    </p>
                </div>
            `,
        });

        console.log("Ticket Reply Email sent successfully");
        return data;
    } catch (error) {
        console.error("Error sending ticket reply email: ", error);
    }
};

module.exports = {
    sendNewTicketAdminEmail,
    sendTicketReplyEmail
};
