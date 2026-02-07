const express = require("express");
const router = express.Router();
const {
  getFeedback,
  submitFeedback,
  getUserFeedback,
  getFeedbackByUser,
  deleteFeedback,
} = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.get("/", protect, getFeedback);
router.post("/", protect, submitFeedback);
router.get("/user/:userId", protect, getUserFeedback);  // Feedback RECEIVED
router.get("/by/:userId", protect, getFeedbackByUser);  // Feedback GIVEN
router.delete("/:id", protect, deleteFeedback); // admin only

module.exports = router;
