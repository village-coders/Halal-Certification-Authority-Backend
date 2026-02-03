const express = require("express")
const authRouter = express.Router()
const {signup, login, verifyEmail, updateUserPassword, adminLogin} = require("../Controllers/authController")
const uploadAuthImage = require("../Config/authMulter")
const isVerified = require("../Middlewares/isVerified")
const isLoggedIn = require("../Middlewares/isLoggedIn")

authRouter.post("/signup", uploadAuthImage.single("authImage"), signup)
authRouter.post("/login", login)
authRouter.post("/admin-login", adminLogin)
authRouter.post("/verify/:token", verifyEmail)
authRouter.put("/update-password/:id", isLoggedIn, updateUserPassword)

module.exports = authRouter 