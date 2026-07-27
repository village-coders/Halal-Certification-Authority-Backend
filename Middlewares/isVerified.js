// user
// user.isVerified === true
const isVerified = (req, res, next)=>{
    if(req?.user.isVerified !== true){
        return res.status(403).json({
            status: "error",
            message: "You must be verified to perform this action."
        })
    }

    next()
}

module.exports = isVerified