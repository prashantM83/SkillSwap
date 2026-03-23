// Load environment variables FIRST
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");

// 🔍 DEBUG: check if .env file exists
const envPath = path.join(__dirname, ".env");
console.log("🔍 Looking for .env at:", envPath);
console.log("📄 .env exists:", fs.existsSync(envPath));

// 🔐 Force-load .env
require("dotenv").config({ path: envPath });

// 🔍 DEBUG: print env value
console.log("🔐 MONGO_URI from env =", process.env.MONGO_URI);

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const connectDB = require("./config/database");
const swaggerSpec = require("./swagger");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const swapRoutes = require("./routes/swaps");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");
const messageRoutes = require("./routes/messages");
const notificationRoutes = require("./routes/notifications");
const sessionRoutes = require("./routes/sessions");

// Socket handler
const { initializeSocket } = require("./socket/socketHandler");

// Cron jobs
const { initializeReminderJobs } = require("./jobs/reminderJob");

// Initialize app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// CORS allowlist from env (comma-separated)
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser tools (no Origin header) + allowed browser origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    // Previous single-origin setup:
    // origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Connection settings for low latency
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
});

// Initialize socket handlers
const { onlineUsers } = initializeSocket(io);

// Make io accessible to routes
app.set("io", io);
app.set("onlineUsers", onlineUsers);

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors(
    // Previous single-origin setup:
    // {
    //   origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    //   credentials: true,
    // }
    corsOptions,
  )
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sessions", sessionRoutes);

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Health check route
app.get("/", (req, res) => {
  res.send("🌐 SkillSwap API is running with Socket.io...");
});

// Get online users count
app.get("/api/online-users", (req, res) => {
  res.json({
    count: onlineUsers.size,
    users: Array.from(onlineUsers.keys()),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
  
  // Initialize reminder cron jobs
  initializeReminderJobs(io, onlineUsers);
});
