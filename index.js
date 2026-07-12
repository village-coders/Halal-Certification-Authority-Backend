const express = require('express');
const http = require('http');
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const rateLimit = require("express-rate-limit")

const { connectToDb } = require("./Config/connectToDb");


const authRouter = require('./Routes/authRouter');
const userRouter = require('./Routes/userRouter');
const productRouter = require('./Routes/productRouter');
const applicationRouter = require('./Routes/applicationRouter');
const certificateRouter = require('./Routes/certificateRouter');
const messageRouter = require('./Routes/messageRouter');
const invoiceRouter = require('./Routes/invoiceRouter');
const logsheetRouter = require('./Routes/logsheetRouter');
const auditRouter = require('./Routes/auditRouter');
const notificationRouter = require('./Routes/notificationRouter');
const documentRouter = require('./Routes/documentRouter');
const fileRouter = require('./Routes/fileRouter');
const branchRouter = require('./Routes/branchRouter');
const ticketRouter = require('./Routes/ticketRouter');

const errorHandler = require("./Middlewares/errorHandler");
const startCertificateExpiryCron = require('./Jobs/certificateExpiryCron');

// ------------------------
// Middleware
// ------------------------
app.set("trust proxy", 1);

const allowedOrigins = process.env.client_domain
  ? process.env.client_domain.split(",").map(url => url.trim())
  : [];

if (process.env.ADMIN_DOMAIN) {
  process.env.ADMIN_DOMAIN.split(",").forEach(url => {
    if (url.trim() && !allowedOrigins.includes(url.trim())) {
      allowedOrigins.push(url.trim());
    }
  });
}

// Ensure production domains are always allowed to prevent CORS issues
const productionDomains = [
  'https://hdiportal.com',
  'https://www.hdiportal.com',
  'https://admin.hdiportal.com',
  'https://www.admin.hdiportal.com'
];

productionDomains.forEach(domain => {
  if (!allowedOrigins.includes(domain)) {
    allowedOrigins.push(domain);
  }
});

app.use(cors({
  origin: function (origin, callback) {
    // In production, enforce whitelist; in development allow any origin
    if (process.env.NODE_ENV === 'production') {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Error: Origin ${origin} is not allowed`));
    }
    // Development mode – reflect the request origin (or allow all)
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));



const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use('/uploads', express.static('uploads'));

// ------------------------
// Routes
// ------------------------

// Ensure database connection is ready before processing any routes
app.use(async (req, res, next) => {
  try {
    await connectToDb();
    next();
  } catch (error) {
    console.error("Database connection failed for request:", error.message);
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

app.get("/", (req, res) => {
  res.send("Welcome to Halal And Haram Distinction Initiative Development API v1.0");
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/messages", messageRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/logsheets", logsheetRouter);

app.use("/api/audits", auditRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/documents", documentRouter);
app.use("/api/files", fileRouter);
app.use("/api/branches", branchRouter);
app.use("/api/tickets", ticketRouter);

// Catch-all for unknown routes (404)
// Express 5 compatible middleware
app.use((req, res) => {
  res.status(404).json({
    message: `${req.method} ${req.originalUrl} is not an endpoint on this server.`
  })
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
startCertificateExpiryCron();

const PORT = process.env.PORT || 333;

const startServer = async () => {
  try {
    await connectToDb();
    
    // Automatically set isBuilder: true for test@gmail.com
    try {
      const UserModel = require("./Models/user");
      await UserModel.updateOne(
        { email: "test@gmail.com" },
        { $set: { isBuilder: true } }
      );
      console.log("Updated test@gmail.com with isBuilder: true");
    } catch (err) {
      console.error("Failed to auto-update test@gmail.com isBuilder status:", err);
    }

    if (process.env.NODE_ENV !== "production") {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        // console.log(`WebSocket server ready at ws://localhost:${PORT}`);
      })
    }
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer()


module.exports = server