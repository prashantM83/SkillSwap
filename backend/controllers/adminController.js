const User = require("../models/User");
const Swap = require("../models/SwapRequest");
const Feedback = require("../models/Feedback");
const AdminMessage = require("../models/AdminMessage");
const { sendMail, emailTemplates } = require("../utils/mailSender");

// Middleware check
const isAdmin = (user) => user?.isAdmin;

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  const totalUsers = await User.countDocuments();
  const totalSwaps = await Swap.countDocuments();
  const totalFeedback = await Feedback.countDocuments();
  res.json({ totalUsers, totalSwaps, totalFeedback });
};

// GET /api/admin/users
exports.getAllUsersAdmin = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  const users = await User.find().select("-password");
  res.json(users);
};

// GET /api/admin/swaps
exports.getAllSwapsAdmin = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  const swaps = await Swap.find().populate("fromUserId toUserId");
  res.json(swaps);
};

// GET /api/admin/feedback
exports.getAllFeedbackAdmin = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  const feedbacks = await Feedback.find().populate("fromUserId toUserId");
  res.json(feedbacks);
};

// CRUD for Admin Messages
exports.createMessage = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  
  const { title, content, type, sendEmail } = req.body;
  const msg = await AdminMessage.create({ title, content, type });

  // Send email to all users if requested
  if (sendEmail) {
    try {
      const users = await User.find({ isBanned: false }).select("name email");
      const emailTemplate = emailTemplates.adminAnnouncement;
      
      // Send emails in background (non-blocking)
      users.forEach((user) => {
        const announcement = emailTemplate(user.name, title, content, type);
        sendMail({
          to: user.email,
          subject: announcement.subject,
          html: announcement.html,
        }).catch((err) => console.error(`Failed to send announcement to ${user.email}:`, err.message));
      });

      console.log(`Admin announcement email queued for ${users.length} users`);
    } catch (emailError) {
      console.error("Failed to send announcement emails:", emailError);
    }
  }

  res.status(201).json(msg);
};

exports.getMessages = async (req, res) => {
  const messages = await AdminMessage.find({ isActive: true }).sort({
    createdAt: -1,
  });
  res.json(messages);
};

exports.updateMessage = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  const msg = await AdminMessage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!msg) return res.sendStatus(404);
  res.json(msg);
};

exports.deleteMessage = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);
  await AdminMessage.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted successfully" });
};

// GET /api/admin/reports
exports.getReports = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);

  const users = await User.find().select("-password");
  const swaps = await Swap.find().populate("fromUserId toUserId");
  const feedbacks = await Feedback.find().populate("fromUserId toUserId");

  res.json({
    users,
    swaps,
    feedbacks,
  });
};

// POST /api/admin/recalculate-swap-counts - Recalculate swap counts for all users
exports.recalculateSwapCounts = async (req, res) => {
  if (!isAdmin(req.user)) return res.sendStatus(403);

  try {
    console.log("Recalculating swap counts for all users...");

    // Get all users
    const users = await User.find();

    for (const user of users) {
      // Count swaps where user is either fromUserId or toUserId
      const swapCount = await Swap.countDocuments({
        $or: [{ fromUserId: user._id }, { toUserId: user._id }],
      });

      // Update user's totalSwaps
      await User.findByIdAndUpdate(user._id, { totalSwaps: swapCount });
      console.log(
        `Updated ${user.name} (${user.email}) with ${swapCount} swaps`,
      );
    }

    res.json({ message: "Swap counts recalculated successfully" });
  } catch (error) {
    console.error("Error recalculating swap counts:", error);
    res.status(500).json({ message: "Error recalculating swap counts" });
  }
};
