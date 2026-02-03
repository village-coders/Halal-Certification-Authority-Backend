require("dotenv").config();
const { Resend } = require("resend");
const userEmail = "akinkunmialabi123@gmail.com";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  try {
    console.log("📤 Sending test email...");

    const response = await resend.emails.send({
      from: "Halal Food Certification <onboarding@theyoungpioneers.com>",
      to: userEmail,   // replace with your real email
      subject: "Test Email from Resend",
      html: "<p>This is a test email from Resend</p>",
    });

    console.log("📧 Resend response:", response);
  } catch (err) {
    console.error("❌ Error sending email:", err);
  }
}

main();
