const express = require("express");
const router = express.Router();
const Session = require("../models/Session");
const SwapRequest = require("../models/SwapRequest");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");
const { sendMail, emailTemplates } = require("../utils/mailSender");

// Helper to send notifications
const sendSessionNotification = async (io, userId, notification) => {
  const savedNotification = await Notification.create({
    userId,
    ...notification,
  });

  // Send real-time notification if user is online
  const onlineUsers = io?.get?.("onlineUsers");
  const socketId = onlineUsers?.get?.(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", savedNotification);
  }

  return savedNotification;
};

// @route   POST /api/sessions
// @desc    Create a new session
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      swapRequestId,
      guestUserId,
      title,
      description,
      scheduledAt,
      duration,
      timezone,
      meetingLink,
      meetingType,
      location,
      notes,
    } = req.body;

    // Validate swap request exists and user is part of it
    const swapRequest = await SwapRequest.findById(swapRequestId)
      .populate("fromUserId", "name email")
      .populate("toUserId", "name email");

    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Check if user is part of this swap
    const isFromUser = swapRequest.fromUserId._id.toString() === req.user._id.toString();
    const isToUser = swapRequest.toUserId._id.toString() === req.user._id.toString();

    if (!isFromUser && !isToUser) {
      return res.status(403).json({ error: "Not authorized to schedule for this swap" });
    }

    // Only allow scheduling for accepted swaps
    if (swapRequest.status !== "accepted") {
      return res.status(400).json({ error: "Can only schedule sessions for accepted swaps" });
    }

    // Create session
    const session = await Session.create({
      swapRequestId,
      hostUserId: req.user._id,
      guestUserId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      timezone: timezone || "UTC",
      meetingLink,
      meetingType: meetingType || "external",
      location,
      notes,
    });

    // Generate Jitsi room if needed
    let jitsiMeetingLink = null;
    if (meetingType === "jitsi") {
      session.generateJitsiRoomId();
      await session.save();
      jitsiMeetingLink = `https://meet.jit.si/${session.jitsiRoomId}`;
    }

    // Populate for response
    const populatedSession = await Session.findById(session._id)
      .populate("hostUserId", "name email profilePhoto")
      .populate("guestUserId", "name email profilePhoto")
      .populate("swapRequestId", "skillOffered skillWanted");

    // Determine the actual meeting link to share
    const actualMeetingLink = meetingType === "jitsi" ? jitsiMeetingLink : meetingLink;

    // Send notification to guest
    const io = req.app.get("io");
    await sendSessionNotification(io, guestUserId, {
      type: "session_scheduled",
      title: "New Session Scheduled",
      message: `${req.user.name} scheduled a session: "${title}"`,
      data: {
        sessionId: session._id,
        swapRequestId,
        scheduledAt: session.scheduledAt,
        meetingType: meetingType || "external",
        meetingLink: actualMeetingLink,
        jitsiRoomId: session.jitsiRoomId,
        location,
        duration: duration || 60,
      },
    });

    // Send email to guest
    const guestUser = isFromUser ? swapRequest.toUserId : swapRequest.fromUserId;
    try {
      // Build meeting info for email
      let meetingInfo = "";
      if (meetingType === "jitsi" && jitsiMeetingLink) {
        meetingInfo = `<p><strong>Video Call:</strong> <a href="${jitsiMeetingLink}" style="color: #2563eb;">Join Jitsi Meeting</a></p>`;
      } else if (meetingLink) {
        meetingInfo = `<p><strong>Meeting Link:</strong> <a href="${meetingLink}" style="color: #2563eb;">${meetingLink}</a></p>`;
      } else if (location) {
        meetingInfo = `<p><strong>Location:</strong> ${location}</p>`;
      }

      await sendMail(
        guestUser.email,
        `Session Scheduled: ${title}`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📅 New Session Scheduled</h2>
          <p>Hi ${guestUser.name},</p>
          <p><strong>${req.user.name}</strong> has scheduled a skill swap session with you.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${title}</h3>
            <p><strong>Date:</strong> ${new Date(scheduledAt).toLocaleString()}</p>
            <p><strong>Duration:</strong> ${duration || 60} minutes</p>
            ${meetingInfo}
            ${description ? `<p><strong>Description:</strong> ${description}</p>` : ""}
          </div>
          <p>Log in to SkillSwap to view details and manage your sessions.</p>
        </div>`
      );
    } catch (emailError) {
      console.error("Failed to send session email:", emailError);
    }

    res.status(201).json(populatedSession);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// @route   GET /api/sessions
// @desc    Get all sessions for current user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const { status, upcoming, past } = req.query;

    const query = {
      $or: [{ hostUserId: req.user._id }, { guestUserId: req.user._id }],
    };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter upcoming sessions
    if (upcoming === "true") {
      query.scheduledAt = { $gte: new Date() };
      query.status = { $in: ["scheduled", "in-progress"] };
    }

    // Filter past sessions
    if (past === "true") {
      query.scheduledAt = { $lt: new Date() };
    }

    const sessions = await Session.find(query)
      .populate("hostUserId", "name email profilePhoto")
      .populate("guestUserId", "name email profilePhoto")
      .populate("swapRequestId", "skillOffered skillWanted status")
      .sort({ scheduledAt: upcoming === "true" ? 1 : -1 });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// @route   GET /api/sessions/swap/:swapId
// @desc    Get all sessions for a specific swap
// @access  Private
router.get("/swap/:swapId", protect, async (req, res) => {
  try {
    const swapRequest = await SwapRequest.findById(req.params.swapId);

    if (!swapRequest) {
      return res.status(404).json({ error: "Swap request not found" });
    }

    // Verify user is part of this swap
    const isParticipant =
      swapRequest.fromUserId.toString() === req.user._id.toString() ||
      swapRequest.toUserId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const sessions = await Session.find({ swapRequestId: req.params.swapId })
      .populate("hostUserId", "name email profilePhoto")
      .populate("guestUserId", "name email profilePhoto")
      .sort({ scheduledAt: 1 });

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching swap sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get a single session
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("hostUserId", "name email profilePhoto")
      .populate("guestUserId", "name email profilePhoto")
      .populate("swapRequestId", "skillOffered skillWanted status");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify user is part of this session
    const isParticipant =
      session.hostUserId._id.toString() === req.user._id.toString() ||
      session.guestUserId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    res.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update a session
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Only host can update
    if (session.hostUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the host can update the session" });
    }

    // Don't allow updates to completed/cancelled sessions
    if (["completed", "cancelled"].includes(session.status)) {
      return res.status(400).json({ error: "Cannot update completed or cancelled sessions" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "scheduledAt",
      "duration",
      "timezone",
      "meetingLink",
      "meetingType",
      "location",
      "notes",
      "status",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        session[field] = req.body[field];
      }
    });

    // Regenerate Jitsi room if switching to Jitsi
    if (req.body.meetingType === "jitsi" && !session.jitsiRoomId) {
      session.generateJitsiRoomId();
    }

    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate("hostUserId", "name email profilePhoto")
      .populate("guestUserId", "name email profilePhoto")
      .populate("swapRequestId", "skillOffered skillWanted");

    // Notify guest of update
    const io = req.app.get("io");
    await sendSessionNotification(io, session.guestUserId, {
      type: "session_updated",
      title: "Session Updated",
      message: `${req.user.name} updated the session: "${session.title}"`,
      data: {
        sessionId: session._id,
        scheduledAt: session.scheduledAt,
      },
    });

    res.json(populatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

// @route   PUT /api/sessions/:id/cancel
// @desc    Cancel a session
// @access  Private
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("hostUserId", "name email")
      .populate("guestUserId", "name email");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Either participant can cancel
    const isParticipant =
      session.hostUserId._id.toString() === req.user._id.toString() ||
      session.guestUserId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (session.status === "cancelled") {
      return res.status(400).json({ error: "Session is already cancelled" });
    }

    session.status = "cancelled";
    session.cancelledBy = req.user._id;
    session.cancelReason = req.body.reason || "";
    await session.save();

    // Notify the other user
    const otherUserId =
      session.hostUserId._id.toString() === req.user._id.toString()
        ? session.guestUserId._id
        : session.hostUserId._id;

    const io = req.app.get("io");
    await sendSessionNotification(io, otherUserId, {
      type: "session_cancelled",
      title: "Session Cancelled",
      message: `${req.user.name} cancelled the session: "${session.title}"`,
      data: {
        sessionId: session._id,
        reason: session.cancelReason,
      },
    });

    // Send cancellation email
    const otherUser =
      session.hostUserId._id.toString() === req.user._id.toString()
        ? session.guestUserId
        : session.hostUserId;

    try {
      await sendMail(
        otherUser.email,
        `Session Cancelled: ${session.title}`,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">❌ Session Cancelled</h2>
          <p>Hi ${otherUser.name},</p>
          <p><strong>${req.user.name}</strong> has cancelled the scheduled session.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0;">${session.title}</h3>
            <p><strong>Was scheduled for:</strong> ${new Date(session.scheduledAt).toLocaleString()}</p>
            ${session.cancelReason ? `<p><strong>Reason:</strong> ${session.cancelReason}</p>` : ""}
          </div>
          <p>You can schedule a new session through the platform.</p>
        </div>`
      );
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
    }

    res.json({ message: "Session cancelled", session });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).json({ error: "Failed to cancel session" });
  }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Mark session as completed
// @access  Private
router.put("/:id/complete", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Either participant can mark as completed
    const isParticipant =
      session.hostUserId.toString() === req.user._id.toString() ||
      session.guestUserId.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    session.status = "completed";
    if (req.body.notes) {
      session.notes = req.body.notes;
    }
    await session.save();

    res.json({ message: "Session marked as completed", session });
  } catch (error) {
    console.error("Error completing session:", error);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

// @route   GET /api/sessions/jitsi/:sessionId
// @desc    Get Jitsi room info for a session
// @access  Private
router.get("/jitsi/:sessionId", protect, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate("hostUserId", "name")
      .populate("guestUserId", "name");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verify user is part of this session
    const isParticipant =
      session.hostUserId._id.toString() === req.user._id.toString() ||
      session.guestUserId._id.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (session.meetingType !== "jitsi") {
      return res.status(400).json({ error: "This session does not use Jitsi" });
    }

    // Generate room ID if not exists
    if (!session.jitsiRoomId) {
      session.generateJitsiRoomId();
      await session.save();
    }

    res.json({
      roomId: session.jitsiRoomId,
      roomName: session.title,
      userName: req.user.name,
      isHost: session.hostUserId._id.toString() === req.user._id.toString(),
    });
  } catch (error) {
    console.error("Error getting Jitsi info:", error);
    res.status(500).json({ error: "Failed to get Jitsi info" });
  }
});

module.exports = router;
