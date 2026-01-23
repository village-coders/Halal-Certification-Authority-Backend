const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config()

const mongoDbUri = process.env.Mongo_Uri
const connectToDb = async ()=>{
    try {
        const connected = await mongoose.connect(mongoDbUri)
        if(connected){
            console.log("mongodb connected");            
        }
    } catch (error) {
        console.log(error);
    }
}
connectToDb()
module.exports = connectToDb

