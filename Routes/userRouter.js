const express = require("express")
const userRouter = express.Router()

const {getAllUsers, getUserById, updateUser, createUser} = require("../Controllers/userController")
const uploadAuthImage = require("../Config/authMulter")
const isLoggedIn = require("../Middlewares/isLoggedIn")

userRouter.get("/", getAllUsers)
userRouter.put("/:id",  updateUser)
userRouter.get("/:id", getUserById)
userRouter.post("/", isLoggedIn, createUser)


module.exports = userRouter