// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/database");
// const { sendMailer } = require("./utils/mailSender");


// // Load env vars
// dotenv.config();

// // Connect to DB
// connectDB();

// // Init express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());


// // calling nodemailer testing
// sendMailer(
//   {
//     // to: "dhairyaadroja3391@gmail.com",
//     subject : "",
//     html : `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
//   <h2 style="color: #4A90E2;">🌟 Skill Swap – Collaboration Opportunity</h2>

//   <p>Hi there 👋,</p>

//   <p>
//     I hope you're doing great! I'm reaching out from <strong>Skill Swap</strong> to explore a potential 
//     collaboration 🤝. We believe your skills could be a perfect match for our community.
//   </p>

//   <p>
//     If you're interested, feel free to reply to this email or log in to the platform to check your 
//     latest requests and updates ✨.
//   </p>

//   <p>
//     Looking forward to connecting with you!<br>
//     Warm regards,<br>
//     <strong>Skill Swap Team</strong> 💼
//   </p>

//   <hr style="margin-top: 30px;">

//   <p style="font-size: 12px; color: gray;">
//     📩 This is an automated email. If you received it by mistake, please ignore it.
//   </p>
// </div>
// `
//   }
// )


// const authRoutes = require("./routes/auth");
// const userRoutes = require("./routes/users");
// const swapRoutes = require("./routes/swaps");
// const feedbackRoutes = require("./routes/feedback");
// const adminRoutes = require("./routes/admin");

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/swaps", swapRoutes);
// app.use("/api/feedback", feedbackRoutes);
// app.use("/api/admin", adminRoutes);

// // Test route
// app.get("/", (req, res) => {
//   res.send("🌐 SkillSwap API is running...");
// });

// // Listen
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });
// Load environment variables FIRST

const path = require("path");
const fs = require("fs");

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
const connectDB = require("./config/database");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const swapRoutes = require("./routes/swaps");
const feedbackRoutes = require("./routes/feedback");
const adminRoutes = require("./routes/admin");

// Initialize app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/swaps", swapRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("🌐 SkillSwap API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
