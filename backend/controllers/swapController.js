const SwapRequest = require("../models/SwapRequest");
const User = require("../models/User");
const { sendMail, emailTemplates } = require("../utils/mailSender");
const { sendNotificationToUser } = require("../socket/socketHandler");

// Create Swap
exports.createSwap = async (req, res) => {
  try {
    const { toUserId, skillOffered, skillWanted, message } = req.body;
    const swap = await SwapRequest.create({
      fromUserId: req.user._id,
      toUserId,
      skillOffered,
      skillWanted,
      message,
    });

    // Increment totalSwaps for both users
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalSwaps: 1 } });
    await User.findByIdAndUpdate(toUserId, { $inc: { totalSwaps: 1 } });

    // Send real-time notification
    const io = req.app.get("io");
    if (io) {
      await sendNotificationToUser(io, toUserId, {
        type: "swap_request",
        title: "New Swap Request",
        message: `${req.user.name} wants to swap ${skillOffered} for ${skillWanted}`,
        data: {
          swapId: swap._id,
          fromUser: { _id: req.user._id, name: req.user.name },
        },
      });
    }

    // Send email notification to recipient (non-blocking)
    const toUser = await User.findById(toUserId);
    const fromUser = await User.findById(req.user._id);
    if (toUser && fromUser) {
      const swapEmail = emailTemplates.swapRequest(
        toUser.name,
        fromUser.name,
        skillOffered,
        skillWanted
      );
      sendMail({
        to: toUser.email,
        subject: swapEmail.subject,
        html: swapEmail.html,
      }).catch((err) => console.error("Failed to send swap notification:", err.message));
    }

    res.status(201).json(swap);
  } catch (error) {
    console.error("Error creating swap:", error);
    res.status(500).json({ message: "Error creating swap request" });
  }
};

// Get All Swaps (Admin or user-specific)
exports.getAllSwaps = async (req, res) => {
  const filter = req.user.isAdmin
    ? {}
    : {
        $or: [{ fromUserId: req.user._id }, { toUserId: req.user._id }],
      };
  const swaps = await SwapRequest.find(filter)
    .populate("fromUserId", "name email")
    .populate("toUserId", "name email");
  res.json(swaps);
};

// Get Swap by ID
exports.getSwapById = async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id)
    .populate("fromUserId", "name email")
    .populate("toUserId", "name email");
  if (!swap) return res.status(404).json({ message: "Swap not found" });
  if (
    !req.user.isAdmin &&
    ![swap.fromUserId._id, swap.toUserId._id].includes(req.user._id.toString())
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  res.json(swap);
};

// Update Swap Status
exports.updateSwapStatus = async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("fromUserId", "name email")
      .populate("toUserId", "name email");
    if (!swap) return res.status(404).json({ message: "Swap not found" });

    if (
      swap.toUserId._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const previousStatus = swap.status;
    swap.status = req.body.status;
    await swap.save();

    // Send real-time notification to swap initiator
    const io = req.app.get("io");
    if (io && previousStatus !== req.body.status) {
      const statusTitles = {
        accepted: "Swap Accepted!",
        rejected: "Swap Declined",
        completed: "Swap Completed!",
        cancelled: "Swap Cancelled",
      };
      await sendNotificationToUser(io, swap.fromUserId._id.toString(), {
        type: `swap_${req.body.status}`,
        title: statusTitles[req.body.status] || "Swap Updated",
        message: `Your swap request has been ${req.body.status}`,
        data: { swapId: swap._id },
      });
    }

    // Send email notification to swap initiator about status change (non-blocking)
    if (previousStatus !== req.body.status && swap.fromUserId.email) {
      const statusEmail = emailTemplates.swapStatusUpdate(
        swap.fromUserId.name,
        req.body.status,
        swap.skillOffered,
        swap.skillWanted
      );
      sendMail({
        to: swap.fromUserId.email,
        subject: statusEmail.subject,
        html: statusEmail.html,
      }).catch((err) => console.error("Failed to send status notification:", err.message));
    }

    // If swap is being completed, send special completion emails to both users
    if (req.body.status === "completed" && previousStatus !== "completed") {
      console.log("Swap completed:", swap._id);
      
      // Send completion email to fromUser (initiator)
      const fromUserEmail = emailTemplates.swapCompleted(
        swap.fromUserId.name,
        swap.toUserId.name,
        swap.skillOffered,
        swap.skillWanted
      );
      sendMail({
        to: swap.fromUserId.email,
        subject: fromUserEmail.subject,
        html: fromUserEmail.html,
      }).catch((err) => console.error("Failed to send completion email to fromUser:", err.message));

      // Send completion email to toUser (recipient)
      const toUserEmail = emailTemplates.swapCompleted(
        swap.toUserId.name,
        swap.fromUserId.name,
        swap.skillWanted, // They taught what fromUser wanted
        swap.skillOffered // They learned what fromUser offered
      );
      sendMail({
        to: swap.toUserId.email,
        subject: toUserEmail.subject,
        html: toUserEmail.html,
      }).catch((err) => console.error("Failed to send completion email to toUser:", err.message));
    }

    res.json(swap);
  } catch (error) {
    console.error("Error updating swap status:", error);
    res.status(500).json({ message: "Error updating swap status" });
  }
};

// Delete/Cancel Swap
exports.deleteSwap = async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: "Swap not found" });

  if (
    swap.fromUserId.toString() !== req.user._id.toString() &&
    swap.toUserId.toString() !== req.user._id.toString() &&
    !req.user.isAdmin
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await swap.deleteOne();
  res.json({ message: "Swap request deleted" });
};

// Get Sent Requests
exports.getSentSwaps = async (req, res) => {
  const swaps = await SwapRequest.find({ fromUserId: req.user._id }).populate(
    "toUserId",
    "name email",
  );
  res.json(swaps);
};

// Get Received Requests
exports.getReceivedSwaps = async (req, res) => {
  const swaps = await SwapRequest.find({ toUserId: req.user._id }).populate(
    "fromUserId",
    "name email",
  );
  res.json(swaps);
};
