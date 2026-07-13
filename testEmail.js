const sendVerificationEmail = require("./Services/Nodemailer/sendVerificationEmail");

async function runTest() {
    console.log("Starting email test...");
    try {
        await sendVerificationEmail("awwalsaminu9@gmail.com", "Awwal", "test-token-12345");
        console.log("Test script finished successfully.");
    } catch (error) {
        console.error("Test script failed:", error);
    }
}

runTest();