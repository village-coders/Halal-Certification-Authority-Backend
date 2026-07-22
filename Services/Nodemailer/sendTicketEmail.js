const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

const sendNewTicketAdminEmail = async (adminEmail, ticket, userName) => {
    try {
        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🎫 New Support Ticket: ${ticket.ticketNumber} - ${ticket.title}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Hello <strong>Admin</strong>,</p>

                    <p>A new support ticket has been submitted by <strong>${userName}</strong>.</p>

                    <div style="background-color: #f8fafc; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; color: #334155;"><strong>Ticket Number:</strong> <span style="color: #00853b; font-weight: bold;">${ticket.ticketNumber}</span></p>
                        <p style="margin: 0 0 8px 0; color: #334155;"><strong>Title:</strong> ${ticket.title}</p>
                        <p style="margin: 0 0 8px 0; color: #334155;"><strong>Category:</strong> ${ticket.category}</p>
                        <p style="margin: 0 0 8px 0; color: #334155;"><strong>Priority:</strong> ${ticket.priority}</p>
                        <p style="margin: 0; color: #334155;"><strong>Description:</strong><br/> ${ticket.description}</p>
                    </div>

                    <p style="color: #475569;">
                        Please log in to the admin portal to review and respond to this ticket.
                    </p>

                    <p style="margin-top: 32px; margin-bottom: 0;">
                      Best regards,<br />
                      <strong>Halal & Haram Distinction Development Initiative (HDI) System</strong>
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

        console.log("New Ticket Admin Email sent successfully");
        return data;
    } catch (error) {
        console.error("Error sending new ticket admin email: ", error);
    }
};

const sendTicketReplyEmail = async (recipientEmail, recipientName, ticket, replyContent, senderName) => {
    try {
        const data = await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: recipientEmail,
            subject: `💬 New Reply to Ticket: ${ticket.ticketNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                  <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
                    
                    <header style="text-align: center; margin-bottom: 24px;">
                      <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                        <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                      </a>
                      <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
                    </header>

                    <p style="font-size: 16px;">Dear <strong>${recipientName}</strong>,</p>

                    <p>The Halal Team wishes you continued success in your business endeavors.</p>

                    <p>
                        You have received a new reply on ticket <strong style="color: #00853b;">${ticket.ticketNumber}</strong> from <strong>${senderName}</strong>.
                    </p>

                    <div style="background-color: #f8fafc; border-left: 4px solid #00853b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #334155; white-space: pre-wrap;">${replyContent}</p>
                    </div>

                    <p>
                        Please log in to your dashboard to view the full conversation and respond if necessary.
                    </p>

                    <p style="margin-top: 32px; margin-bottom: 0;">
                      Kind regards,<br />
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
