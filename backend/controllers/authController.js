const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail, emailTemplates } = require("../utils/mailSender");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters long" });
    }

    if (!/[a-zA-Z]/.test(name)) {
      return res.status(400).json({ message: "Name must contain at least one letter" });
    }

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashedPassword });

    // Send welcome email (non-blocking)
    const welcomeEmail = emailTemplates.welcome(user.name);
    sendMail({
      to: user.email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
    }).catch((err) => console.error("Failed to send welcome email:", err.message));

    const token = generateToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // Check if user is banned
  if (user.isBanned) {
    return res.status(403).json({ message: "Your account has been banned. Please contact support." });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refreshToken in DB
  user.refreshTokens.push(refreshToken);
  await user.save();

  res.status(200).json({
    token: accessToken,
    refreshToken,
    user,
  });
};
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token missing" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove this refresh token from user's list
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Get current user from token
exports.getMe = async (req, res) => {
  try {
    res.status(200).json(req.user); // `req.user` is populated from JWT
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// In-memory OTP storage (for production, use Redis or database)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/auth/forgot-password - Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ message: "If an account exists with this email, you will receive an OTP" });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expiresAt, attempts: 0 });

    // Send email
    const resetEmail = emailTemplates.passwordReset(user.name, otp);
    await sendMail({
      to: user.email,
      subject: resetEmail.subject,
      html: resetEmail.html,
    });

    res.status(200).json({ message: "If an account exists with this email, you will receive an OTP" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
};

// POST /api/auth/verify-otp - Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      return res.status(400).json({ message: "No OTP request found. Please request a new OTP" });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Check attempts
    if (stored.attempts >= 3) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "Too many failed attempts. Please request a new OTP" });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts++;
      return res.status(400).json({ message: "Invalid OTP. Please try again" });
    }

    // OTP verified - mark it as verified
    stored.verified = true;
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// POST /api/auth/reset-password - Reset password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const stored = otpStore.get(email.toLowerCase());

    if (!stored || stored.otp !== otp || !stored.verified) {
      return res.status(400).json({ message: "Invalid or unverified OTP. Please verify OTP first" });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ message: "OTP has expired. Please request a new one" });
    }

    // Update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.refreshTokens = []; // Invalidate all existing sessions
    await user.save();

    // Clear OTP
    otpStore.delete(email.toLowerCase());

    res.status(200).json({ message: "Password reset successfully. Please login with your new password" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
