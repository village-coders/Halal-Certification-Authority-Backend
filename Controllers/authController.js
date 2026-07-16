const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const userModel = require("../Models/user")
const sendVerificationEmail = require("../Services/Nodemailer/sendVerificationEmail")
const generateRandomString = require("../Utils/generateRandomString")
const sendVerificationEmailToAdmin = require("../Services/Nodemailer/sendVerificationEmailToAdmin")
const sendResetPasswordEmail = require("../Services/Nodemailer/sendResetPasswordEmail")

//Signup
const signup = async (req, res, next) => {
    const { password, email, companyName, fullName, } = req.body
    // const file = req.file.path
    try {
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

        const currentYear = new Date().getFullYear()
        const companyCount = await userModel.countDocuments({ })
        const formattedCount = String(companyCount + 1).padStart(4, '0');
        const uniqueId = `${formattedCount}-${currentYear}`;
        const regNo = `HDI-${uniqueId}${Math.floor(Math.random() * 100)}`;

        const user = await userModel.create({ ...req.body, email: formattedEmail, password: hashedPassword, verificationToken: token, verificationExp, registrationNo: regNo })

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "could not sign up"
            })
        }

        const companyFirstName = companyName ? companyName.split(" ")[0] : "User";
        await sendVerificationEmail(email, companyName || fullName, token)

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

        const formattedEmail = email ? email.trim().toLowerCase() : "";
        const user = await userModel.findOne({ email: formattedEmail });
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

            if (!user.verificationExp || user.verificationExp < now) {
                const userFirstName = user.companyName ? user.companyName.split(" ")[0] : "User"
                const newCode = generateRandomString(8)

                user.verificationToken = newCode;
                user.verificationExp = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
                await user.save();

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
            { id: user._id, name: user.fullName, email: user.email, role: user.role, registrationNo: user.registrationNo },
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
            isVerified: user?.isVerified,
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

        const formattedEmail = email ? email.trim().toLowerCase() : "";
        const user = await userModel.findOne({ email: formattedEmail });
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

        if (user.role !== "admin" && user.role !== "super admin") {
            return res.status(403).json({
                status: "error",
                message: "You are not an administrator"
            })
        }

        if (user.isActive === false) {
            return res.status(403).json({
                status: "error",
                message: "Your account is inactive. Please contact the super admin."
            })
        }

        if (!user.isVerified) {
            const now = new Date();
            if (!user.verificationExp || user.verificationExp < now) {
                const userFirstName = user.fullName ? user.fullName.split(" ")[0] : "Admin"
                const newCode = generateRandomString(8)

                user.verificationToken = newCode;
                user.verificationExp = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
                await user.save();


                await sendVerificationEmailToAdmin(user.email, userFirstName.toUpperCase(), newCode);

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
            { id: user._id, name: user.fullName, email: user.email, role: user.role },
            process.env.jwt_secret,
            { expiresIn: process.env.jwt_exp }
        );

        const userData = {
            _id: user._id,
            name: user.fullName,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role,
            image: user.authImage,
            privileges: user.privileges || []
        };

        res.status(200).json({
            status: "success",
            message: "Login successful. Welcome back!",
            accessToken,
            isVerified: user?.isVerified,
            user: userData
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

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
        next(err);
    }
};

const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const formattedEmail = email ? email.trim().toLowerCase() : "";
        const user = await userModel.findOne({ email: formattedEmail });
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "There is no user with that email address.",
            });
        }

        const resetToken = generateRandomString(32);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();

        const isAdmin = user.role === "admin" || user.role === "super admin";
        await sendResetPasswordEmail(user.email, user.fullName, resetToken, isAdmin);

        res.status(200).json({
            status: "success",
            message: "Password reset link sent to email!",
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                status: "error",
                message: "Password reset link is invalid or has expired",
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({
            status: "success",
            message: "Password reset successful! You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Reset Password Error:", error);
        next(error);
    }
};

const impersonateClient = async (req, res, next) => {
    const { clientId } = req.body;
    const adminUserId = req.user.id;

    try {
        const adminUser = await userModel.findById(adminUserId);
        if (!adminUser) {
            return res.status(404).json({ status: "error", message: "Admin user not found" });
        }

        // Only allow if user is admin, super admin, or has isBuilder: true
        const allowed = adminUser.role === 'super admin' || adminUser.isBuilder === true;
        if (!allowed) {
            return res.status(403).json({ status: "error", message: "Unauthorized to impersonate clients" });
        }

        const clientUser = await userModel.findById(clientId);
        if (!clientUser) {
            return res.status(404).json({ status: "error", message: "Client company not found" });
        }

        if (clientUser.role !== 'company') {
            return res.status(400).json({ status: "error", message: "Cannot impersonate non-client users" });
        }

        // Generate JWT token for the client user
        const accessToken = jwt.sign(
            { id: clientUser._id, name: clientUser.fullName, email: clientUser.email, role: clientUser.role, registrationNo: clientUser.registrationNo },
            process.env.jwt_secret,
            { expiresIn: process.env.jwt_exp }
        );

        const userData = {
            _id: clientUser._id,
            name: clientUser.fullName,
            email: clientUser.email,
            isVerified: clientUser.isVerified,
            role: clientUser.role,
            image: clientUser.authImage
        };

        res.status(200).json({
            status: "success",
            message: `Successfully authenticated as ${clientUser.companyName || clientUser.fullName}`,
            accessToken,
            isVerified: clientUser.isVerified,
            user: userData
        });

    } catch (error) {
        console.error("Impersonate error:", error);
        next(error);
    }
};

module.exports = {
    verifyEmail,
    login,
    signup,
    updateUserPassword,
    adminLogin,
    forgotPassword,
    resetPassword,
    impersonateClient
}
