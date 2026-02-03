const mongoose = require('mongoose')

const siteSchema = new mongoose.Schema({
    siteName: {
        type : String,
        required: true
    },
    email:{
        type : String,
        required: true
    },
    address1:{
        type : String,
        required: true
    },
    address2:{
        type : String,
        required: true
    },
    postCode:{
        type : String,
        required: true
    },
    state:{
        type : String,
        required: true
    },
    city:{
        type : String,
        required: true
    },
    country:{
        type : String,
        required: true
    },
    contactName:{
        type : String,
        required: true
    },
    contactNumber:{
        type : String,
        required: true
    },
})