const newsModel = require('../Models/news')


const createNews = async(req, res, next) => {
    const {title, description} = req.body
    try {
        const image = req.file.path || ""

        const news = await newsModel.create({title, description, image})

        if(!news){
            return res.status(404).json({
                status: "error",
                message: "could not create news"
            })
        }


        res.status(200).json({
            status: "success",
            message: "News created successfully",
            news
        })


    } catch (error) {
        console.log(error)
        next(error)
    }
}



module.exports = {createNews}