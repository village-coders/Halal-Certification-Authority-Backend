const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "mail.halalcert.com.ng",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
    },
});

module.exports = transporter;

transporter.verify((err, success) => {
    if (success) {
        console.log("Ready to send email via cPanel Nodemailer");        
    } else {
        console.log("Transporter verification failed:", err);        
    }
});