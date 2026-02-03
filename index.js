const express = require('express');
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require('dotenv');
dotenv.config();

require("./Config/connectToDb");
require("./Services/Nodemailer/transporter");
const authRouter = require('./Routes/authRouter');
const userRouter = require('./Routes/userRouter');
const productRouter = require('./Routes/productRouter');

const errorHandler = require("./Middlewares/errorHandler");
const isLoggedIn = require('./Middlewares/isLoggedIn');
const applicationRouter = require('./Routes/applicationRouter');
const certificateRouter = require('./Routes/certificateRouter');
const messageRouter = require('./Routes/messageRouter');

const clientDomain = process.env.client_domain

app.use(cors());
// app.use(cors({
//     origin: process.env.client_domain
// }))
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(morgan("dev"))

app.listen(333, ()=>{
    console.log('listen to port 333');    
})
//Routes
app.get("/", (req, res)=>{res.send("Welcome to Halal Certification Authority Api version 1.0")})

app.use("/api/auth", authRouter)
app.use("/api/users", userRouter)
app.use("/api/products", productRouter)
app.use("/api/applications", applicationRouter)
app.use("/api/certificates", certificateRouter)
app.use("/api/messages", messageRouter)

app.use(express.json())

app.all("/{*any}", (req, res) => {
    res.json(`${req.method} ${req.originalUrl} is not an endpoint on this server.`)
})
// app.use((req, res, next) => {
//   res.set('Cache-Control', 'no-store');
//   next();
// });

app.use(errorHandler);