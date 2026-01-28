const SwapRequest = require("../models/SwapRequest");
const User = require("../models/User");

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
    const swap = await SwapRequest.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: "Swap not found" });

    if (
      swap.toUserId.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const previousStatus = swap.status;
    swap.status = req.body.status;
    await swap.save();

    // If swap is being completed, we might want to update ratings or other metrics
    if (req.body.status === "completed" && previousStatus !== "completed") {
      console.log("Swap completed:", swap._id);
      // You could add rating logic here if needed
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
