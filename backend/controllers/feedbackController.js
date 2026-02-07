const Feedback = require("../models/Feedback");
const User = require("../models/User");
const SwapRequest = require("../models/SwapRequest");

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

// POST /api/feedback - Create feedback with strict validation
exports.submitFeedback = async (req, res) => {
  try {
    const { swapId, toUserId, rating, comment } = req.body;
    const fromUserId = req.user._id;

    // Rule 1: Cannot give feedback to yourself
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You cannot give feedback to yourself" });
    }

    // Rule 2: Swap must exist and be completed
    const swap = await SwapRequest.findById(swapId);
    if (!swap) {
      return res.status(404).json({ message: "Swap request not found" });
    }
    if (swap.status !== "completed") {
      return res.status(400).json({ message: "Feedback can only be given for completed swaps" });
    }

    // Rule 3: User must be part of the swap
    const swapFromUser = swap.fromUserId.toString();
    const swapToUser = swap.toUserId.toString();
    const currentUser = fromUserId.toString();

    if (currentUser !== swapFromUser && currentUser !== swapToUser) {
      return res.status(403).json({ message: "You are not part of this swap" });
    }

    // Rule 4: Feedback must be given to the OTHER party in the swap
    const expectedRecipient = currentUser === swapFromUser ? swapToUser : swapFromUser;
    if (toUserId !== expectedRecipient) {
      return res.status(400).json({ message: "Feedback must be given to the other party in the swap" });
    }

    // Rule 5: Cannot give feedback twice for the same swap
    const existingFeedback = await Feedback.findOne({
      swapId,
      fromUserId: fromUserId,
    });
    if (existingFeedback) {
      return res.status(400).json({ message: "You have already submitted feedback for this swap" });
    }

    const feedback = new Feedback({
      swapId,
      fromUserId,
      toUserId,
      rating,
      comment,
    });

    await feedback.save();

    // Recalculate average rating for the user who received the feedback
    const allFeedback = await Feedback.find({ toUserId });
    const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
    await User.findByIdAndUpdate(toUserId, { rating: avgRating });

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/user/:userId - Feedback RECEIVED by user
exports.getUserFeedback = async (req, res) => {
  const feedbacks = await Feedback.find({
    toUserId: req.params.userId,
  })
    .populate("fromUserId", "name")
    .populate("toUserId", "name");
  res.json(feedbacks);
};

// GET /api/feedback/by/:userId - Feedback GIVEN by user
exports.getFeedbackByUser = async (req, res) => {
  const feedbacks = await Feedback.find({
    fromUserId: req.params.userId,
  })
    .populate("fromUserId", "name")
    .populate("toUserId", "name");
  res.json(feedbacks);
};

// DELETE /api/feedback/:id - Admin only
exports.deleteFeedback = async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden" });

  const deleted = await Feedback.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Feedback not found" });
  res.json({ message: "Feedback deleted" });
};
