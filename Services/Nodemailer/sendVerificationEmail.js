const dotenv = require("dotenv");
const transporter = require('./transporter');

const sendVerificationEmail = async(email, userFirstName, token) => {
  const options = {
    to: email,
    subject: "✅ Verify Your Email for Halal Food Certification",
    from: `"Halal Food Certification" <${process.env.Nodemailer_User}>`,
    replyTo: "support@halalfoodcertification.org",
    html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6; padding: 20px;">
        <p style="margin-bottom: 16px;">Dear ${userFirstName},</p>

        <p style="margin-bottom: 16px;">
          Thank you for applying with <strong>Halal Food Certification</strong>. We’re excited to support your journey in ensuring halal compliance and trust for your customers.
        </p>

        <p style="margin-bottom: 16px;">
          To complete your registration, please confirm your email address by clicking the button below:
        </p>

        <p style="margin: 20px 0;">
          <a href="${process.env.client_domain}/verify/${token}"
             style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
             Verify My Email
          </a>
        </p>

        <p style="margin-bottom: 16px;">
          Email verification helps us secure your account and keep you updated on the status of your halal certification process.
        </p>

        <p style="margin-bottom: 16px;">
          We look forward to working with you.
        </p>

        <p style="font-weight: bold;">The Halal Food Certification Team</p>
      </div>
    `
  };

  await transporter.sendMail(options, (err, info) => {
    if (err) {
      console.log(err.message);
    } else {
      console.log("Verification email sent successfully");
    }
  });
};

module.exports = sendVerificationEmail;
