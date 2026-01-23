const express = require("express")
const userRouter = express.Router()

const {getAllUsers, getUserById, getUserByQuery, updateUser} = require("../Controllers/userController")
const uploadAuthImage = require("../Config/authMulter")

userRouter.get("/", getAllUsers)
userRouter.get("/", getUserByQuery)
userRouter.put("/:id", uploadAuthImage.single("authImage"), updateUser)
userRouter.get("/:id", getUserById)


module.exports = userRouter