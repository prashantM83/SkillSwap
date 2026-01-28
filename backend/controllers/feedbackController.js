const Feedback = require("../models/Feedback");

// GET /api/feedback?swapId=&toUserId= - Filtered
exports.getFeedback = async (req, res) => {
  const filter = {};
  if (req.query.swapId) filter.swapId = req.query.swapId;
  if (req.query.toUserId) filter.toUserId = req.query.toUserId;

  const feedbacks = await Feedback.find(filter)
    .populate("fromUserId", "name")
    .populate("toUserId", "name");
  res.json(feedbacks);
};

// POST /api/feedback - Create feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { swapId, toUserId, rating, comment } = req.body;

    const feedback = new Feedback({
      swapId,
      fromUserId: req.user._id,
      toUserId,
      rating,
      comment,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/user/:userId - Feedback received by user
exports.getUserFeedback = async (req, res) => {
  const feedbacks = await Feedback.find({
    toUserId: req.params.userId,
  }).populate("fromUserId", "name");
  res.json(feedbacks);
};

// DELETE /api/feedback/:id - Admin only
exports.deleteFeedback = async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });

  const deleted = await Feedback.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Feedback not found" });
  res.json({ message: "Feedback deleted" });
};
