const express = require('express');
const http = require('http');
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);

require("./Config/connectToDb");
require("./Services/Nodemailer/transporter");

const authRouter = require('./Routes/authRouter');
const userRouter = require('./Routes/userRouter');
const productRouter = require('./Routes/productRouter');
const applicationRouter = require('./Routes/applicationRouter');
const certificateRouter = require('./Routes/certificateRouter');
const messageRouter = require('./Routes/messageRouter');

const errorHandler = require("./Middlewares/errorHandler");

// ------------------------
// Middleware
// ------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ------------------------
// Routes
// ------------------------
app.get("/", (req, res) => {
  res.send("Welcome to Halal Certification Authority API v1.0");
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/messages", messageRouter);

// Catch-all for unknown routes
app.all("/{*any}", (req, res) => {
    res.json(`${req.method} ${req.originalUrl} is not an endpoint on this server.`)
})

// Error handler
app.use(errorHandler);

// ------------------------
// Socket.IO setup (Single initialization)
// ------------------------
const { initSocket } = require("./Services/socketService");

// Initialize Socket.IO once
const io = initSocket(server);

// Make io available globally through getIo() function
// No need to set on app, as controllers will use getIo()

// ------------------------
// Start server
// ------------------------
const PORT = process.env.PORT || 333;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}`);
});