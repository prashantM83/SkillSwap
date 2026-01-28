const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is banned (except for admin routes)
    if (req.user.isBanned && !req.path.startsWith("/admin")) {
      return res.status(403).json({
        message: "Your account has been banned. Please contact support.",
      });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { protect };
