const express = require("express")
const authRouter = express.Router()
const { signup, login, verifyEmail, updateUserPassword, adminLogin, forgotPassword, resetPassword } = require("../Controllers/authController")
const uploadAuthImage = require("../Config/authMulter")
const isVerified = require("../Middlewares/isVerified")
const isLoggedIn = require("../Middlewares/isLoggedIn")

authRouter.post("/signup", uploadAuthImage.single("authImage"), signup)
authRouter.post("/login", login)
authRouter.post("/admin-login", adminLogin)
authRouter.post("/verify/:token", verifyEmail)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/reset-password/:token", resetPassword)
authRouter.put("/update-password/:id", isLoggedIn, updateUserPassword)

module.exports = authRouter 