const productModel = require("../Models/product");

const createProduct = async (req, res, next) =>{
    const {name} = req.body;
    const userId = req.user.id;
    try {
        const product = await productModel.create({...req.body, companyId: userId})
        if(!product){
            return res.status(404).json({
                status: "error",
                message: "could not create product"
            })
        }

        res.status(200).json({
            status: "success",
            message: `Request for Product: ${name} successfully created`,
            product
        })
    } catch (error) {
        console.log(error);
        next(error)        
    }
}

const getMyProducts = async (req, res, next) =>{
    const userId = req.user.id;
    try {
        const products = await productModel.find({ companyId: userId })
        if(!products){
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }

        res.status(200).json({
            status: "success",
            message: `Products loaded successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);      
    }
}

const deleteMyProduct = async (req, res, next) => {
    const productId = req.params.id;
    try {
        const product = await productModel.deleteOne({_id: productId});
        if(!product){
            return res.status(404).json({
                status: "error",
                message: "failed to delete your product"
            })
        }

        res.status(200).json({
            status: "success",
            message: "Your product deleted successfully"
        })
    } catch (error) {
        console.log(error);
        next(error);   
    }
}

module.exports = {
    createProduct,
    getMyProducts,
    deleteMyProduct,
}