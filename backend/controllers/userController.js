const User = require("../models/User");

// GET /api/users - Get all users (with optional filters)
exports.getAllUsers = async (req, res) => {
  try {
    const { skill, location } = req.query;
    let filter = {};

    if (skill) filter.skillsOffered = { $regex: skill, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    const users = await User.find(filter).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id - Get single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id - Update profile (owner or admin)
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id - Delete account (admin or owner)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/:id/ban - Admin bans user
exports.banUser = async (req, res) => {
  try {
    console.log(
      "Ban request from user:",
      req.user._id,
      "isAdmin:",
      req.user.isAdmin,
    );

    if (!req.user.isAdmin) {
      console.log("Non-admin user attempted to ban");
      return res.status(403).json({ message: "Admin only" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true },
      { new: true },
    ).select("-password");

    if (!user) {
      console.log("User not found for banning:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Successfully banned user:", user._id, user.name);
    res.json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Error banning user:", error);
    res
      .status(500)
      .json({ message: "Error banning user", error: error.message });
  }
};

// POST /api/users/:id/unban - Admin unbans user
exports.unbanUser = async (req, res) => {
  try {
    console.log(
      "Unban request from user:",
      req.user._id,
      "isAdmin:",
      req.user.isAdmin,
    );

    if (!req.user.isAdmin) {
      console.log("Non-admin user attempted to unban");
      return res.status(403).json({ message: "Admin only" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false },
      { new: true },
    ).select("-password");

    if (!user) {
      console.log("User not found for unbanning:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Successfully unbanned user:", user._id, user.name);
    res.json({ message: "User unbanned successfully", user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res
      .status(500)
      .json({ message: "Error unbanning user", error: error.message });
  }
};

// GET /api/users/search?skill=&location= - Search API
exports.searchUsers = async (req, res) => {
  const { skill, location } = req.query;
  const filter = {};

  if (skill) filter.skillsOffered = { $regex: skill, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };

  const users = await User.find(filter).select("-password");
  res.json(users);
};
