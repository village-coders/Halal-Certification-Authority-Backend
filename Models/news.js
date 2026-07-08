const mongoose = require('mongoose')


const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {timestamp: true})


const newsModel = mongoose.model('news', newsSchema)

module.exports = newsModel