const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendBulkEmail = async (emails, subject, content) => {
  try {
    console.log(`📤 Sending bulk email to ${emails.length} recipients`);

    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="HDI Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">HDI</h2>
            </header>

            <div style="color: #333; line-height: 1.6;">
              ${content.replace(/\n/g, '<br/>')}
            </div>

            <p style="margin-top: 32px; margin-bottom: 0;">
              Best regards,<br />
              <strong>The Halal Team</strong><br />
              HDI
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
            <footer style="text-align: center; font-size: 13px; color: #666; line-height: 1.5;">
              <p style="margin: 4px 0; font-weight: bold; color: #333;">The HDI Team</p>
              <p style="margin: 4px 0;">Website: <a href="https://halalcert.com.ng" style="color: #00853b; text-decoration: none;">halalcert.com.ng</a></p>
              <p style="margin: 4px 0;">Email: <a href="mailto:support@halalcert.com.ng" style="color: #00853b; text-decoration: none;">support@halalcert.com.ng</a></p>
            </footer>
          </div>
        </div>
      `;

    // Send individually to each recipient so clients never see other clients' email addresses
    const sendPromises = emails.map(async (recipient) => {
      try {
        const info = await transporter.sendMail({
          from: `HDI <${process.env.EMAIL_USER}>`,
          to: recipient,
          subject: subject,
          html: htmlContent,
        });
        return { email: recipient, success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`❌ Failed to send bulk email to ${recipient}:`, err.message);
        return { email: recipient, success: false, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`📧 Bulk email delivery complete: ${successCount} sent successfully, ${failCount} failed.`);
    return results;
  } catch (error) {
    console.error("Bulk Email Error:", error);
    throw error;
  }
};

module.exports = sendBulkEmail;
