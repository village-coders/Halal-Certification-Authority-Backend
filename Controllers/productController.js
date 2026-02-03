const productModel = require("../Models/product");
const userModel = require("../Models/user");
const sendProductApprovalEmail = require("../Services/Resend/productApprovalEmail");

const createProduct = async (req, res, next) =>{
    const {name} = req.body;
    const userId = req.user.id;
    try {
        const company = await userModel.findById(userId)

        const product = await productModel.create({...req.body, companyId: company.registrationNo, createdBy: userId})

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
    const company = await userModel.findById(userId)
    try {
        const products = await productModel.find({ companyId: company.registrationNo })
        if(!products){
            return res.status(404).json({
                status: "error",
                message: "You have no product available",
                products: []
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

const getSingleProducts = async (req, res, next) =>{
    // const company = await userModel.findById(userId)
    const {id} = req.params
    try {
        const product = await productModel.findById(id)
        if(!product){
            return res.status(404).json({
                status: "success",
                message: "You have no product available",
                product: []
            })
        }

        res.status(200).json({
            status: "success",
            message: `Products loaded successfully`,
            product
        })
    } catch (error) {
        console.log(error);
        next(error);      
    }
}

const getAllProducts = async (req, res, next) =>{

    try {
        const query = req.query;
        let build = {}

        // if(req.user.role !== "admin" && company.registrationNo){
        //     build.companyId = company.registrationNo
        // }
        
        if(query.status){
            build.status = query.status
        }

        const products = await productModel.find(build)
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

const approveProduct = async (req, res, next) =>{
    const { id } = req.params
    try {

        const products = await productModel.findById(id)

        if(!products){
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }
        
        const company = await userModel.findOne({registrationNo: products.companyId, isUnderCompany: false})
        // console.log(company);
        
        if(!company){
            res.status(404).json({
                status: "error",
                message: "No company found"
            })
        }
        company.approvedProducts = (company.approvedProducts || 0) + 1;

        products.status = "approved"

        await products.save()
        await company.save()

        await sendProductApprovalEmail(company.email, company.companyName, products.name)

        res.status(200).json({
            status: "success",
            message: `Products approved successfully`,
            products
        })
    } catch (error) {
        console.log(error);
        next(error);      
    }
}


const rejectProduct = async (req, res, next) =>{
    const { id } = req.params
    try {

        const products = await productModel.findById(id)

        if(!products){
            return res.status(404).json({
                status: "error",
                message: "You have no product available"
            })
        }
        
        const company = await userModel.findOne({registrationNo: products.companyId, isUnderCompany: false})
        console.log(company);
        
        if(!company){
            res.status(404).json({
                status: "error",
                message: "No company found"
            })
        }
        company.approvedProducts = (company.approvedProducts || 0) + 1;

        products.status = "rejected"

        await products.save()
        await company.save()

        res.status(200).json({
            status: "success",
            message: `Products rejected successfully`,
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
    getAllProducts,
    getSingleProducts,
    approveProduct,
    rejectProduct
}