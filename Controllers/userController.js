const { default: mongoose } = require("mongoose");
const userModel = require("../Models/user");
const generateRandomString = require("../Utils/generateRandomString");
const bcrypt = require("bcryptjs");
const sendVerificationEmail = require("../Services/Resend/sendVerificationEmail");
const sendVerificationEmailToAdmin = require("../Services/Resend/sendVerificationEmailToAdmin");

const getAllUsers = async (req, res, next) => {
    const query = req.query;

    try {
        let filter = {};
        
        if (query.companyId) {
            filter.registrationNo = query.companyId;
        }
        
        if(query.role){
            filter.role = query.role
        }else{
            filter.role = "company";
        }

        // filter.isUnderCompany = true

        if(query.isUnderCompany){
            filter.isUnderCompany = query.isUnderCompany
        }

        // You might also want to exclude sensitive fields
        const users = await userModel.find(filter).select('-password -__v');
        
        // Return empty array instead of 404 if no users found
        res.status(200).json({
            status: 'success',
            message: users.length > 0 ? "Users fetched successfully!" : "No users found",
            count: users.length,
            users
        });

    } catch (error) {
        console.log(error);
        next(error);
    }
}



const getUserById = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        // 1. Add validation for the ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: "error",
                message: "Invalid user ID format"
            });
        }

        const findUser = await userModel.findById(id);
        
        // 2. Check if user exists
        if (!findUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        // 3. Create user object - Consider what you need to expose
        const user = {
            companyName: findUser.companyName,
            fullName: findUser.fullName, // You might want to include this
            email: findUser.email,
            id: findUser._id,
            image: findUser.authImage,
            contact: findUser.companyContact,
            registrationNo: findUser.registrationNo,
            address: findUser.address,
            lga: findUser.lga,
            city: findUser.city,
            state: findUser.state,
            position: findUser.position,
            website: findUser.website,
            role: findUser.role,
            status: findUser.status, // Add status field if it exists
            isVerified: findUser.isVerified,
            createdAt: findUser.createdAt,
            updatedAt: findUser.updatedAt
        };

        res.status(200).json({
            status: 'success',
            message: "User fetched successfully!",
            user
        });

    } catch (error) {
        console.error("Error fetching user:", error); // Better error logging        
        next(error);
    }
}

const createUser = async (req, res, next)=>{
    // const file = req.file.path
    const {fullName, email, password, department} = req.body
    const id = req.user.id
    try {
        const company = await userModel.findById(id)
        // console.log(company);
        
        // if (!req.file || !req.file.path) {
        //     return res.status(400).json({
        //         status: "error",
        //         message: "Image upload failed or missing",
        //     });
        // }
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "User with this email already exists",
            });
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const token = generateRandomString(8)
        const verificationExp = Date.now() + 300000

        const user = await userModel.create({...company, email, fullName, department, password: hashedPassword, registrationNo: company.registrationNo, isUnderCompany: true, companyName: company.companyName, verificationToken: token, verificationExp})
        
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "could not sign up"
            })
        }
        
        const firstName = fullName.split(" ")[0]
        await sendVerificationEmail(email, firstName.toUpperCase(), token)

        res.status(202).json({
            status: "success",
            message: "Sign up successful",
            user
        })

    } catch (error) {
        console.log(error)
        next(error)      
    }
}


// findByIdAndUpdate(id, body)
const updateUser = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        // if (!req.file || !req.file.path) {
        //     return res.status(400).json({
        //         status: "error",
        //         message: "Image upload failed or missing",
        //     });
        // }

        const updatedFields = {
            ...req.body,              // Spread all fields from form
            // authImage: req.file.path  // Add uploaded image path
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

// findByIdAndDelete(id)

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
        
        if(req.user.isUnderCompany){
            return res.status(400).json({
                status: "error",
                message: "UnAuthorized, Only the main user with company can delete user"
            })
        }
        if(user.id === req.user.id){
            return res.status(400).json({
                status: "error",
                message: "You cannot delete yourself"
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

const deleteAdmin = async (req, res, next)=>{
    const {id} = req.params
    try{
        // check if user exist
        const user = await userModel.findById(id)
        
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "admin not found"
            })
        }

        if(user.role === "super admin"){
            return res.status(400).json({
                status: "error",
                message: "You cannot delete super admin"
            })
        }
        
        if(user.id === req.user.id){
            return res.status(400).json({
                status: "error",
                message: "You cannot delete yourself"
            })
        }
        await userModel.findByIdAndDelete(id)
        res.status(200).json({
            status: "success",
            message: "admin has been deleted"
        })
    } catch(error) {
        console.log(error);
        next(error);
    }
}

const createAdmin = async (req, res, next)=>{
    // const file = req.file.path
    const {fullName, email, password, contact} = req.body
    // const id = req.user.id
    try {
        if(req.user.role !== "super admin"){
            return res.status(400).json({
                status: "error",
                message: "UnAuthorized. You are not an super admin",
            });
        }
        // const company = await userModel.findById(id)

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "User with this email already exists",
            });
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const token = generateRandomString(8)
        const verificationExp = Date.now() + 300000

        const admin = await userModel.create({ email, fullName, role: "admin", contact, password: hashedPassword, isVerified: false, verificationToken: token, verificationExp})
        
        if(!admin){
            return res.status(404).json({
                status: "error",
                message: "could not sign up"
            })
        }
        
        const adminFirstName = fullName.split(" ")[0]
        await sendVerificationEmailToAdmin(email, adminFirstName.toUpperCase(), token)

        res.status(202).json({
            status: "success",
            message: "Sign up successful",
            admin
        })

    } catch (error) {
        console.log(error)
        next(error)      
    }
}

const getAllAdmin = async (req, res, next) => {
  try {
    
    
    if (req.user.role !== "super admin") {
      return res.status(403).json({
        status: "error",
        message: "You must be a super admin to perform this action.",
      });
    }

    const ROLES = {
        ADMIN : "admin",
        SUPER_ADMIN : "super admin"
    }


    const users = await userModel
      .find({
        role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] }
      })
      .select("-password -__v");

    res.status(200).json({
      status: "success",
      message: users.length
        ? "Admins fetched successfully!"
        : "No admins found",
      count: users.length,
      users,
    });
  } catch (error) {
    console.log(error)    
    next(error);
  }
};




module.exports = {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUser,
    createUser,
    createAdmin,
    getAllAdmin,
    deleteAdmin
}