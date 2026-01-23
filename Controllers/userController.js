const userModel = require("../Models/user")

const getAllUsers = async (req, res, next)=>{
    try {
        const users = await userModel.find() // return all users
        if(!users){
            return res.status(404).json({
                status: "error",
                message: "Users not found"
            })
        }

        res.status(200).json({
            status: 'success',
            message: "users fetched!",
            users
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

const getUserById = async (req, res, next)=>{
    const {id} = req.params
    try {
        const findUser = await userModel.findById(id)
        if(!findUser){
            return res.status(404).json({
                status: "error",
                message: "user not found"
            })
        }

        const user = {
            companyName: findUser.companyName,
            email: findUser.email,
            id: findUser._id,
            image: findUser.authImage,
            contact: findUser.companyContact,
        }

        res.status(200).json({
            status: 'success',
            message: "user fetched!",
            user
        })

    } catch (error) {
        console.log(error);
        next(error);
    }
}

// findByIdAndUpdate(id, body)
// findByIdAndDelete(id)

const getUserByQuery = async (req, res, next)=>{
    const {email} = req.query
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "user not found"
            })
        }

        res.status(200).json({
            status: 'success',
            message: "user fetched!",
            user
        })
    } catch (error) {
        console.log(error)
        next(error)
    }
}

const updateUser = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({
                status: "error",
                message: "Image upload failed or missing",
            });
        }

        const updatedFields = {
            ...req.body,              // Spread all fields from form
            authImage: req.file.path  // Add uploaded image path
        };

        const updatedUser = await userModel.findByIdAndUpdate(id, updatedFields, { new: true });

        if (!updatedUser) {
            return res.status(400).json({
                status: "error",
                message: "User not updated",
            });
        }

        res.status(200).json({
            status: 'success',
            message: "User updated!",
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        next(error);
    }
};



const deleteUser = async (req, res, next)=>{
    const {id} = req.params
    try{
        // check if user exist
        const user = await userModel.findById(id)
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "user not found"
            })
        }
        await userModel.findByIdAndDelete(id)
        res.status(200).json({
            status: "success",
            message: "user has been deleted"
        })
    } catch(error) {
        console.log(error);
        next(error);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByQuery,
    deleteUser,
    updateUser
}