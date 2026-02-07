const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const SwapRequest = require("../models/SwapRequest");
const ReportedMessage = require("../models/ReportedMessage");
const Notification = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Verify swap connection between users
async function verifySwapConnection(userId1, userId2, allowCompleted = true) {
  const statuses = allowCompleted 
    ? ["pending", "accepted", "completed"] 
    : ["accepted"]; // Only accepted swaps can exchange messages
    
  const swapRequest = await SwapRequest.findOne({
    $or: [
      { fromUserId: userId1, toUserId: userId2 },
      { fromUserId: userId2, toUserId: userId1 },
    ],
    status: { $in: statuses },
  });
  return swapRequest;
}

// Get all conversations for the current user (only with swap connections)
router.get("/conversations", protect, async (req, res) => {
  try {
    // Find all swap requests involving this user
    const swapRequests = await SwapRequest.find({
      $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }],
      status: { $in: ["pending", "accepted", "completed"] },
    })
      .populate("fromUserId", "name profilePhoto")
      .populate("toUserId", "name profilePhoto");

    const conversations = [];

    for (const swap of swapRequests) {
      // Determine the other user
      const otherUser =
        swap.fromUserId._id.toString() === req.user._id.toString()
          ? swap.toUserId
          : swap.fromUserId;

      const conversationId = Message.getConversationId(
        req.user._id.toString(),
        otherUser._id.toString()
      );

      // Get latest message
      const lastMessage = await Message.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .select("content createdAt senderId");

      // Count unread messages
      const unreadCount = await Message.countDocuments({
        conversationId,
        receiverId: req.user._id,
        read: false,
      });

      conversations.push({
        conversationId,
        swapRequestId: swap._id,
        swapStatus: swap.status,
        skillOffered: swap.skillOffered,
        skillWanted: swap.skillWanted,
        canReply: swap.status === "accepted", // Only accepted swaps can message
        otherUser: {
          _id: otherUser._id,
          name: otherUser.name,
          profilePhoto: otherUser.profilePhoto,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
            }
          : null,
        unreadCount,
      });
    }

    // Sort by last message date (most recent first)
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get messages for a specific conversation
router.get("/conversation/:userId", protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Verify swap connection
    const hasSwap = await verifySwapConnection(req.user._id, otherUserId);
    if (!hasSwap) {
      return res.status(403).json({ error: "No swap request exists with this user" });
    }

    const conversationId = Message.getConversationId(
      req.user._id.toString(),
      otherUserId
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("senderId", "name profilePhoto")
      .populate("receiverId", "name profilePhoto");

    const total = await Message.countDocuments({ conversationId });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        read: false,
      },
      { read: true }
    );

    res.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get unread message count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Report a message
router.post("/report/:messageId", protect, async (req, res) => {
  try {
    const { reason, additionalDetails } = req.body;
    const messageId = req.params.messageId;

    if (!reason) {
      return res.status(400).json({ error: "Reason is required" });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Verify the user is part of this conversation
    if (
      message.senderId.toString() !== req.user._id.toString() &&
      message.receiverId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: "You cannot report this message" });
    }

    // Cannot report your own message
    if (message.senderId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot report your own message" });
    }

    // Check if already reported by this user
    const existingReport = await ReportedMessage.findOne({
      messageId,
      reportedBy: req.user._id,
    });

    if (existingReport) {
      return res.status(400).json({ error: "You have already reported this message" });
    }

    // Create report
    const report = await ReportedMessage.create({
      messageId,
      reportedBy: req.user._id,
      reportedUser: message.senderId,
      reason,
      additionalDetails,
      messageContent: message.content,
    });

    // Mark message as reported
    await Message.findByIdAndUpdate(messageId, { isReported: true });

    // Notify admins
    const io = req.app.get("io");
    const admins = await require("../models/User").find({ isAdmin: true }).select("_id");
    
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: "message_reported",
        title: "Message Reported",
        message: `A message has been reported for: ${reason}`,
        data: {
          reportId: report._id,
          reportedUser: message.senderId,
        },
      });
    }

    res.json({ message: "Message reported successfully", reportId: report._id });
  } catch (error) {
    console.error("Error reporting message:", error);
    res.status(500).json({ error: "Failed to report message" });
  }
});

// Admin: Get all reported messages
router.get("/reports", protect, adminOnly, async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = status === "all" ? {} : { status };

    const reports = await ReportedMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reportedBy", "name email")
      .populate("reportedUser", "name email")
      .populate("reviewedBy", "name");

    const total = await ReportedMessage.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Admin: Update report status
router.patch("/reports/:reportId", protect, adminOnly, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const reportId = req.params.reportId;

    const report = await ReportedMessage.findByIdAndUpdate(
      reportId,
      {
        status,
        adminNotes,
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate("reportedBy", "name email")
      .populate("reportedUser", "name email");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
});

module.exports = router;
