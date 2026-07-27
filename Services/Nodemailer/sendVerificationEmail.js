const transporter = require("./transporter");
const dotenv = require("dotenv");
dotenv.config();

const sendVerificationEmail = async (email, userFirstName, token) => {
  try {
    console.log("📤 Sending verification email to:", email);

    const logoUrl = "https://hdiportal.com/assets/hdiLogo1-CjnI96Er.png";

    const data = await transporter.sendMail({
      from: `Halal and Haram Distinction Development Initiative <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ Verify Your Email for Halal and Haram Distinction Development Initiative",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 30px;">
            
            <header style="text-align: center; margin-bottom: 24px;">
              <a href="https://halalcert.com.ng" target="_blank" style="text-decoration: none;">
                <img loading="lazy" src="${logoUrl}" alt="Halal & Haram Distinction Development Initiative Logo" style="max-width: 150px; height: auto; margin-bottom: 12px;" />
              </a>
              <h2 style="color: #00853b; margin: 0; font-size: 20px; font-weight: bold;">Halal & Haram Distinction Development Initiative (HDI)</h2>
            </header>

            <p style="font-size: 16px;">Dear <strong>${userFirstName}</strong>,</p>

            <p>
              Welcome to the <strong>Halal & Haram Distinction Development Initiative (HDI).</strong> We are delighted to have you join our platform.
            </p>

            <p>
              Your account has been created successfully. To activate your account and gain full access to our services, please verify your email address by clicking the button below.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.client_domain}/verify/${token}"
                style="display:inline-block;padding:14px 28px;background:#00853b;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
                Verify My Email
              </a>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 24px;">
              If the button above does not work, you can copy and paste the following link into your browser:<br/><br/>
              <a href="${process.env.client_domain}/verify/${token}" style="color: #00853b; word-break: break-all;">
                ${process.env.client_domain}/verify/${token}
              </a>
            </p>

            <p style="margin-top: 24px;">
              Thank you for choosing the Halal & Haram Distinction Development Initiative (HDI). We look forward to serving you and supporting your journey toward Halal compliance.
            </p>

            <p style="margin-top: 32px; margin-bottom: 0;">
              Warm regards,<br />
              <strong>The Halal Team</strong><br />
              Halal & Haram Distinction Development Initiative (HDI).
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
    console.log("📧 Email sent successfully!");
  } catch (error) {
    console.error("Error sending verification email:", error.message || error);    
  }
};

module.exports = sendVerificationEmail;
