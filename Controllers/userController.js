const { default: mongoose } = require("mongoose");
const userModel = require("../Models/user");
const generateRandomString = require("../Utils/generateRandomString");
const { getGridFSBucket } = require('../Config/connectToDb');
const { Readable } = require('stream');
const bcrypt = require("bcryptjs");
const sendVerificationEmail = require("../Services/Nodemailer/sendVerificationEmail");
const sendVerificationEmailToAdmin = require("../Services/Nodemailer/sendVerificationEmailToAdmin");
const sendBulkEmail = require("../Services/Nodemailer/sendBulkEmail");
const { uploadToHybridStorage } = require("../Utils/fileUpload");
const certificateModel = require("../Models/certificate");

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
        console.error("Error fetching all users:", error.message);
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
            isBuilder: findUser.isBuilder,
            privileges: findUser.privileges,
            signatureImage: findUser.signatureImage,
            signatureName: findUser.signatureName,
            signatureTitle: findUser.signatureTitle,
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
        const formattedEmail = email ? email.trim().toLowerCase() : "";
        const existingUser = await userModel.findOne({ email: formattedEmail });
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

        const user = await userModel.create({...company, email: formattedEmail, fullName, department, password: hashedPassword, registrationNo: company.registrationNo, isUnderCompany: true, companyName: company.companyName, verificationToken: token, verificationExp})
        
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
        console.error("Error creating user:", error.message);
        next(error)      
    }
}


// findByIdAndUpdate(id, body)
const updateUser = async (req, res, next) => {
    const { id } = req.params;
    
    try {
        let authImagePath = undefined;

        if (req.file) {
            const uploadResult = await uploadToHybridStorage(
                req.file, 
                'profile-images', 
                'profileImages', 
                { userId: id }
            );
            
            if (uploadResult.fileUrl.startsWith('/api/files/')) {
                authImagePath = `${req.protocol}://${req.get('host')}${uploadResult.fileUrl}`;
            } else {
                authImagePath = uploadResult.fileUrl;
            }
        }

        const updatedFields = {
            ...req.body,              // Spread all fields from form
        };

        if (authImagePath) {
            updatedFields.authImage = authImagePath;
        }

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

const updateAdmin = async (req, res, next)=>{
    const {id} = req.params
    try{
        if(req.user.role !== "super admin" && req.user.role !== "admin"){
            return res.status(400).json({
                status: "error",
                message: "UnAuthorized, Only the super admin can update admin",
            });
        }
        
        delete req.body.password;
        const updatedUser = await userModel.findByIdAndUpdate(id, req.body, {new: true})
        
        if(!updatedUser){
            return res.status(404).json({
                status: "error",
                message: "User not updated",
            });
        }
        res.status(200).json({
            status: 'success',
            message: "User updated!",
            user: updatedUser
        });
    }catch(error){
        console.error(error);
        next(error);
    }
}

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
        console.error("Error deleting user:", error.message);
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

        if (user.role === "super admin" && req.user.role !== "super admin") {
            return res.status(400).json({
                status: "error",
                message: "Only a super admin can delete another super admin"
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
        console.error("Error deleting admin:", error.message);
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

        const formattedEmail = email ? email.trim().toLowerCase() : "";
        const existingUser = await userModel.findOne({ email: formattedEmail });

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

        const { privileges } = req.body
        const admin = await userModel.create({ email: formattedEmail, fullName, role: "admin", contact, password: hashedPassword, isVerified: false, verificationToken: token, verificationExp, privileges})
        
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
        console.error("Error creating admin:", error.message);
        next(error)      
    }
}

const getAllAdmin = async (req, res, next) => {
  try {
    
    
    if (req.user.role !== "super admin" && req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "You must be an admin to perform this action.",
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
    console.error("Error fetching all admins:", error.message);
    next(error);
  }
};

const uploadSignature = async (req, res) => {
    try {
        const { signatureName, signatureTitle } = req.body;
        const updateData = {};
        
        if (signatureName) updateData.signatureName = signatureName;
        if (signatureTitle) updateData.signatureTitle = signatureTitle;

        if (req.file) {
            const bucket = getGridFSBucket('userSignatures');
            const filename = `sig-${req.user.id}-${Date.now()}-${req.file.originalname}`;
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: req.file.mimetype,
                metadata: { userId: req.user.id }
            });

            const bufferStream = new Readable();
            bufferStream.push(req.file.buffer);
            bufferStream.push(null);

            bufferStream.pipe(uploadStream)
                .on('error', (error) => res.status(500).json({ message: error.message }))
                .on('finish', async () => {
                    updateData.signatureImage = `/files/userSignatures/${filename}`;
                    await userModel.findByIdAndUpdate(req.user.id, updateData);
                    return res.status(200).json({ status: 'success', signatureImage: updateData.signatureImage });
                });
        } else {
            // No file uploaded, just update text credentials
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ message: "No signature file or credentials provided to update" });
            }
            await userModel.findByIdAndUpdate(req.user.id, updateData);
            return res.status(200).json({ status: 'success', message: "Credentials updated successfully" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getClientList = async (req, res, next) => {
    const { status, search } = req.query;

    try {
        let userFilter = { role: "company", isUnderCompany: false };
        if (search) {
            userFilter.companyName = { $regex: search, $options: "i" };
        }

        let users = await userModel.find(userFilter).select("companyName email registrationNo");

        if (status) {
            const certs = await certificateModel.find({ status }).select("companyId");
            const companyIdsLower = certs.map(c => c.companyId?.toLowerCase());
            users = users.filter(u => companyIdsLower.includes(u.registrationNo?.toLowerCase()));
        }

        res.status(200).json({
            status: "success",
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

const sendBulkClientEmail = async (req, res, next) => {
    const { emails, subject, content } = req.body;

    try {
        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({ message: "No recipients provided" });
        }
        if (!subject || !content) {
            return res.status(400).json({ message: "Subject and content are required" });
        }

        if (req?.user?.role !== "admin" || "super admin"){
            return res.status(400).json({ message: "You must be an admin to access this route"});
        }

        await sendBulkEmail(emails, subject, content);

        res.status(200).json({
            status: "success",
            message: `Email sent to ${emails.length} recipients`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    createUser,
    getAllAdmin,
    createAdmin,
    deleteUser,
    deleteAdmin,
    updateAdmin,
    uploadSignature,
    getClientList,
    sendBulkClientEmail
}