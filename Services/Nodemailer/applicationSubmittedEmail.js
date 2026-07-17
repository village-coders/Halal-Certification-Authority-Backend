const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Sends an email to the client when they submit a new application or renewal.
 *
 * @param {string} email - Client's email address.
 * @param {string} companyName - The name of the company.
 * @param {string} applicationNumber - The generated application number.
 * @param {string} category - The application category (e.g., "New Application", "Renewal Application").
 */
const applicationSubmittedEmail = async (email, companyName, applicationNumber, category) => {
  try {
    console.log(`📤 Sending application submitted email to client:`, email);

    const clientPortalUrl = `${process.env.CLIENT_DOMAIN || 'http://localhost:5173'}/track-application/${applicationNumber}`;
    const isRenewal = category === "Renewal Application";
    const subject = isRenewal
      ? `✅ Renewal Application Successfully Submitted — ${applicationNumber}`
      : `✅ Application Successfully Submitted — ${applicationNumber}`;

    const badgeLabel = isRenewal ? "Renewal Application" : "New Application";

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #00853b;">Halal And Haram Distinction Initiative Development</h2>
            </div>
            
            <p>Dear ${companyName},</p>

            <p>
              We are writing to confirm that we have successfully received your <strong>${badgeLabel}</strong> 
              (<strong>${applicationNumber}</strong>).
            </p>

            <p>
              Our team will review your submission shortly. You will be notified via email of any updates regarding the status of your application.
            </p>

            <p>
              You can also track the progress of your application at any time by logging into your client dashboard.
            </p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${clientPortalUrl}" style="background-color: #00853b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Application</a>
            </div>

            <p>
              If you have any questions or need further assistance, please feel free to contact our support team.
            </p>

            <p style="margin-top: 32px;">
              Best regards,<br />
              <strong>Halal and Haram Distinction Development Initiative Team</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <div style="text-align: center; color: #888; font-size: 12px;">
                <p>&copy; ${new Date().getFullYear()} Halal And Haram Distinction Development Initiative. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("📧 Application submitted email sent to client successfully!");
    return data;
  } catch (error) {
    console.error("❌ Error sending application submitted email to client:", error);
    return null;
  }
};

module.exports = applicationSubmittedEmail;
