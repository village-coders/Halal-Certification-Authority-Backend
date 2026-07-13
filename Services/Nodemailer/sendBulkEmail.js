const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();



const sendBulkEmail = async (emails, subject, content) => {
  try {
    console.log(`📤 Sending bulk email to ${emails.length} recipients`);

    // Resend allows sending to multiple recipients in the 'to' array
    // Note: There might be limits on the number of recipients per call depending on the plan
    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction and Development Initiative <${process.env.EMAIL_USER}>`,
      to: emails,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
          ${content.replace(/\n/g, '<br/>')}
          <br/><br/>
          <p>Regards,<br/>The Halal and Haram Distinction Development Initiative Team</p>
        </div>
      `,
    });
    console.log("📧 Bulk emails sent successfully!");
    return data;
  } catch (error) {
    console.error("Bulk Email Error:", error);
    throw error;
  }
};

module.exports = sendBulkEmail;
