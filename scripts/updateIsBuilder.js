// scripts/updateIsBuilder.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

// Set Node's DNS resolver to Google DNS to fix querySrv issues on local network
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoDbUri = process.env.Mongo_Uri;

if (!mongoDbUri) {
  console.error("Error: Mongo_Uri is not defined in environment variables.");
  process.exit(1);
}

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

const runUpdate = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoDbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("Connected to MongoDB successfully.");

    const targetEmailRegex = /^villagecoders7@gmail\.com$/i;

    // 1. Set isBuilder: true for villagecoders7@gmail.com (case insensitive)
    const targetResult = await User.updateMany(
      { email: { $regex: targetEmailRegex } },
      { $set: { isBuilder: true } }
    );
    
    const targetUser = await User.findOne({ email: { $regex: targetEmailRegex } });
    if (targetUser) {
      console.log(`Found target user: ${targetUser.email} (ID: ${targetUser._id}), set isBuilder: ${targetUser.isBuilder}`);
    } else {
      console.warn("Warning: User with email villagecoders7@gmail.com was not found in the database!");
    }

    // 2. Set isBuilder: false for all other users
    const othersResult = await User.updateMany(
      { email: { $not: { $regex: targetEmailRegex } } },
      { $set: { isBuilder: false } }
    );
    console.log(`Updated all other users with isBuilder: false (${othersResult.modifiedCount || othersResult.nModified || 0} updated).`);

    console.log("Script execution completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error updating isBuilder field:", error);
    process.exit(1);
  }
};

runUpdate();
