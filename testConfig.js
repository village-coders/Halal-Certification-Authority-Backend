const nodemailer = require("nodemailer");
require('dotenv').config();

async function testConnection(port, secure) {
    console.log(`Testing port ${port}, secure: ${secure}...`);
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "mail.halalcert.com.ng",
        port: port,
        secure: secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    try {
        await transporter.verify();
        console.log(`✅ Success on port ${port}, secure: ${secure}`);
        return true;
    } catch (err) {
        console.log(`❌ Failed on port ${port}, secure: ${secure}:`, err.message);
        return false;
    }
}

async function run() {
    console.log("Testing credentials:", process.env.EMAIL_USER, process.env.EMAIL_PASS);
    await testConnection(465, true);
    await testConnection(587, false);
    await testConnection(25, false);
}

run();
