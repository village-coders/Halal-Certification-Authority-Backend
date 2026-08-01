const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to all admins when a client rejects an invoice.
 *
 * @param {string[]} adminEmails - Array of admin email addresses.
 * @param {string} companyName - Name of the client company.
 * @param {string} invoiceNumber - The invoice number.
 * @param {string} reason - The client's rejection reason.
 */
const invoiceRejectedEmail = async (adminEmails, companyName, invoiceNumber, reason) => {
    try {
        console.log("📤 Sending invoice rejected notification to admins:", adminEmails);

        const adminPortalUrl = `${process.env.ADMIN_DOMAIN || 'http://localhost:5174'}/invoices`;
        const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

        await transporter.sendMail({
            from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
            to: adminEmails,
            subject: `⚠️ Invoice Rejected by Client — ${invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
                    <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">

                        <header style="text-align: center; margin-bottom: 24px;">
                            <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                                <img loading="lazy" src="${logoUrl}" alt="HDI Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
                            </a>
                            <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal &amp; Haram Distinction Development Initiative</h2>
                        </header>

                        <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
                            <p style="margin: 0; font-weight: bold; color: #856404; font-size: 15px;">⚠️ Invoice Rejected by Client</p>
                        </div>

                        <p style="margin-bottom: 8px;">An invoice has been <strong>rejected</strong> by a client. Please review and take the appropriate action.</p>

                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 15px;">
                            <tr style="background-color: #f3f4f6;">
                                <td style="padding: 10px 14px; font-weight: bold; width: 40%; border-bottom: 1px solid #e5e7eb;">Invoice Number</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Company</td>
                                <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb;">${companyName}</td>
                            </tr>
                            <tr style="background-color: #f3f4f6;">
                                <td style="padding: 10px 14px; font-weight: bold;">Rejection Reason</td>
                                <td style="padding: 10px 14px; color: #b91c1c;">${reason || 'No reason provided'}</td>
                            </tr>
                        </table>

                        <div style="text-align: center; margin-top: 24px;">
                            <a href="${adminPortalUrl}" style="background-color: #00853b; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
                                View Invoices
                            </a>
                        </div>

                        <p style="margin-top: 28px; font-size: 13px; color: #6b7280; text-align: center;">
                            This is an automated notification from the HDI Client Portal.
                        </p>
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error("❌ Error sending invoice rejected email:", error);
    }
};

module.exports = invoiceRejectedEmail;
