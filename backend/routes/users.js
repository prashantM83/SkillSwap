const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  searchUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// User routes
router.get("/", protect, getAllUsers);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

// Admin-only routes
router.post("/:id/ban", protect, banUser);
router.post("/:id/unban", protect, unbanUser);

module.exports = router;
