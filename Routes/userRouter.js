const express = require("express")
const userRouter = express.Router()

const {getAllUsers, getUserById, updateUser, createUser, deleteUser, createAdmin, getAllAdmin, deleteAdmin, updateAdmin, getClientList, sendBulkClientEmail} = require("../Controllers/userController")
const uploadAuthImage = require("../Config/authMulter")
const isLoggedIn = require("../Middlewares/isLoggedIn")
const apiKeyAuth = require("../Middlewares/apiKeyAuth")

userRouter.get("/", getAllUsers)
userRouter.get("/admin", isLoggedIn, getAllAdmin)
userRouter.get("/clients", isLoggedIn, getClientList)
userRouter.post("/bulk-email", isLoggedIn, sendBulkClientEmail)
userRouter.delete("/admin/:id", isLoggedIn, deleteAdmin)
userRouter.put("/admin/:id", isLoggedIn, updateAdmin)
userRouter.put("/:id", uploadAuthImage.single("image"), updateUser)
userRouter.get("/:id", getUserById)
userRouter.delete("/:id", isLoggedIn, deleteUser)
userRouter.post("/", isLoggedIn, createUser)

// External with api key
userRouter.get("/external/clients", apiKeyAuth, getClientList)


// Admin
userRouter.post("/admin", isLoggedIn, createAdmin)
userRouter.post("/signature", isLoggedIn, uploadAuthImage.single("signature"), (req, res, next) => {
    const { uploadSignature } = require("../Controllers/userController");
    uploadSignature(req, res, next);
});


module.exports = userRouter