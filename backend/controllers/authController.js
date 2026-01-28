const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

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

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
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
