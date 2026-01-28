const express = require("express");
const router = express.Router();
const {
  getFeedback,
  submitFeedback,
  getUserFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.get("/", protect, getFeedback);
router.post("/", protect, submitFeedback);
router.get("/user/:userId", protect, getUserFeedback);
router.delete("/:id", protect, deleteFeedback); // admin only

module.exports = router;
