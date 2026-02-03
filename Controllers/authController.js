const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../Models/user")
const sendVerificationEmail = require("../Services/Resend/sendVerificationEmail")
const generateRandomString = require("../Utils/generateRandomString")

//Signup
const signup = async (req, res, next)=>{
    const {password, email, companyName, fullName, } = req.body
    // const file = req.file.path
    try {
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

        const randomNumber  = Math.floor(Math.random() * 1000000);
        const regNo = `HCA-${randomNumber}`;

        const user = await userModel.create({...req.body, password: hashedPassword, verificationToken: token, verificationExp, /*authImage: file,*/ registrationNo: regNo})
        
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "could not sign up"
            })
        }
        
        const companyFirstName = companyName.split(" ")[0]
        await sendVerificationEmail(email, companyName, token)

        res.status(202).json({
            status: "success",
            message: "Sign up successful. Check your email to verify your account",
            user
        })

    } catch (error) {
        console.log(error)
        next(error)      
    }
}

//Verify
const verifyEmail = async (req, res, next) => {
    const { token } = req.params;

    try {
        // Find user with matching verification token
        const user = await userModel.findOne({ verificationToken: token });

        if (!user) {
            return res.status(400).json({
                status: "error",
                message: "This token is invalid or has already been verified",
            });
        }

        // Check if the verification token has expired
        if (user.verificationExp < Date.now()) {
            await userModel.findOneAndDelete({ verificationToken: token }); // delete expired token
            return res.status(403).json({
                status: "error",
                message: "Verification time has expired. Please register again.",
            });
        }

        // Update user as verified
        await userModel.findByIdAndUpdate(user._id, {
            verificationExp: null,
            verificationToken: null,
            isVerified: true,
        });

        return res.status(200).json({
            status: "success",
            message: "Your email has been verified",
        });
    } catch (error) {
        console.error("Verification Error:", error);
        next(error);
    }
};


//Login
const login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({
                status: "error",
                message: "Email or password is incorrect"
            });
        }

        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({
                status: "error",
                message: "Email or password is incorrect"
            });
        }

        if (user.role !== "company") {
            return res.status(403).json({
                status: "error",
                message: "You are not a company"
            });
        }

        if (!user.isVerified) {
            const now = new Date();

            // ✅ If verification code is missing or expired, regenerate
            if (!user.verificationExp || user.verificationExp < now) {
                const userFirstName = user.companyName.split(" ")[0]
                const newCode = generateRandomString(8)

                user.verificationToken = newCode;
                user.verificationExp = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
                await user.save();

                // ✅ Send the new code via email (mock or real)
                await sendVerificationEmail(user.email, userFirstName, newCode);


                return res.status(403).json({
                    status: "error",
                    message: "Email not verified. A new verification code has been sent. Check your spam if not appeared in inbox.",
                });
            }

            return res.status(403).json({
                status: "error",
                message: "Email not verified. Please check your email for the verification code. Check your spam if not appeared in inbox.",
            });
        }


        const accessToken = jwt.sign(
            { id: user._id, name: user.fullName, email: user.email },
            process.env.jwt_secret,
            { expiresIn: process.env.jwt_exp }
        );

        const userData = {
            _id: user._id,
            name: user.fullName,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
            image: user.authImage
        };

        res.status(200).json({
            status: "success",
            message: "Login successful. Welcome back!",
            accessToken,
            isVerified : user?.isVerified,
            user: userData
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

const adminLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required"
            });
        }

        const user = await userModel.findOne({ email });
        if (!user || !user.password) {
            return res.status(401).json({
                status: "error",
                message: "Email or password is incorrect"
            });
        }

        const passwordCorrect = await bcrypt.compare(password, user.password);
        if (!passwordCorrect) {
            return res.status(401).json({
                status: "error",
                message: "Email or password is incorrect"
            });
        }

        if (!user.isVerified) {
            const now = new Date();

            // ✅ If verification code is missing or expired, regenerate
            if (!user.verificationExp || user.verificationExp < now) {
                const userFirstName = user.fullName.split(" ")[0]
                const newCode = generateRandomString(8)

                user.verificationToken = newCode;
                user.verificationExp = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
                await user.save();

                // ✅ Send the new code via email (mock or real)
                await sendVerificationEmailToAdmin(user.email, userFirstName, newCode); // You implement this

                return res.status(403).json({
                    status: "error",
                    message: "Email not verified. A new verification code has been sent. Check your spam if not appeared in inbox.",
                });
            }

            return res.status(403).json({
                status: "error",
                message: "Email not verified. Please check your email for the verification code. Check your spam if not appeared in inbox.",
            });
        }
        

        if(user.role !== "admin" && user.role !== "super admin"){
            return res.status(403).json({
                status: "error",
                message: "You are not an administrator"
            })
        }


        const accessToken = jwt.sign(
            { id: user._id, name: user.fullName, email: user.email },
            process.env.jwt_secret,
            { expiresIn: process.env.jwt_exp }
        );

        const userData = {
            _id: user._id,
            name: user.fullName,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
            image: user.authImage
        };

        res.status(200).json({
            status: "success",
            message: "Login successful. Welcome back!",
            accessToken,
            isVerified : user?.isVerified,
            user: userData
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// PUT /users/update-password/:id

const updateUserPassword = async (req, res, next) => {
  const { id } = req.params;
  
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
    }
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (err) {
    console.log(err);
    next();
  }
};


module.exports = {
    signup,
    verifyEmail,
    login,
    updateUserPassword,
    adminLogin
}