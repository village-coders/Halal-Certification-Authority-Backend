const jwt = require("jsonwebtoken");
const UserModel = require("../Models/user")

const isLoggedIn =  async (req, res, next)=>{
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        // extract the token
        token = req.headers.authorization.split(" ")[1]
    }

    if(!token){
        return res.status(403).json({
            status: "error",
            message: "Please provide token"
        })
    }
    // verify if the token is valid and has not expired
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.jwt_secret);
    } catch (err) {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token. Please log in again."
        });
    }
    // find the user that the token was generated for
    const user = await UserModel.findById(decoded.id)

    if(!user){
        return res.status(404).json({
            status: "error",
            message: "This token belongs to no one"
        })
    }

    req.user = user
    // console.log(user);
    // console.log(decoded);
    // console.log(req.user);
    
    next()
}

module.exports = isLoggedIn