const express = require("express")
const userRouter = express.Router()

const {getAllUsers, getUserById, updateUser, createUser, deleteUser, createAdmin} = require("../Controllers/userController")
const uploadAuthImage = require("../Config/authMulter")
const isLoggedIn = require("../Middlewares/isLoggedIn")

userRouter.get("/", getAllUsers)
userRouter.put("/:id",  updateUser)
userRouter.get("/:id", getUserById)
userRouter.delete("/:id", isLoggedIn, deleteUser)
userRouter.post("/", isLoggedIn, createUser)

// Admin
userRouter.post("/admin", isLoggedIn, createAdmin)


module.exports = userRouter