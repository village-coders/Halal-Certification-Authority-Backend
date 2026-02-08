// Config/connectToDb.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const mongoDbUri = process.env.Mongo_Uri;
let gridFSBucket;

const connectToDb = async () => {
    try {
        const connected = await mongoose.connect(mongoDbUri);
        if (connected) {
            console.log("MongoDB connected");
            
            // Initialize GridFS bucket after connection
            const { GridFSBucket } = require('mongodb');
            gridFSBucket = new GridFSBucket(mongoose.connection.db, {
                bucketName: 'certificatePDFs'
            });
            
            console.log("GridFS bucket initialized");
        }
    } catch (error) {
        console.log("MongoDB connection error:", error);
    }
};

// Function to get the bucket
const getGridFSBucket = () => {
    if (!gridFSBucket) {
        console.warn('GridFS bucket not initialized. Re-initializing...');
        const { GridFSBucket } = require('mongodb');
        gridFSBucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'certificatePDFs'
        });
    }
    return gridFSBucket;
};

connectToDb()

// Export both connection function and bucket getter
module.exports = { connectToDb, getGridFSBucket };