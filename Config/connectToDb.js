// Config/connectToDb.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

// Set Node's DNS resolver to Google DNS to fix querySrv ECONNREFUSED issues on local ISPs/networks
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const mongoDbUri = process.env.Mongo_Uri;
let cachedDb = null;

const connectToDb = async () => {
    // If the database connection is cached, use it instead of creating a new connection
    if (cachedDb) {
        return cachedDb;
    }

    try {
        console.log("Connecting to MongoDB...");
        // mongoose.connect returns a promise. We cache this promise so multiple simultaneous 
        // requests don't initiate multiple connections during a cold start.
        cachedDb = mongoose.connect(mongoDbUri, {
            serverSelectionTimeoutMS: 5000,
        }).then(mongooseInstance => {
            console.log("MongoDB connected successfully");
            return mongooseInstance.connection;
        }).catch(err => {
            console.log("MongoDB connection error:", err);
            cachedDb = null; // reset so we can try again on the next request
            throw err;
        });

        await cachedDb;
        return cachedDb;
    } catch (error) {
        console.log("MongoDB connection error:", error);
        throw error;
    }
};

// Function to get a specific bucket
const getGridFSBucket = (bucketName = 'certificatePDFs') => {
    if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error("Database not connected when trying to get GridFSBucket");
    }
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName
    });
};

// Export both connection function and bucket getter
module.exports = { connectToDb, getGridFSBucket };