const mongoose = require("mongoose");

const swapRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skillOffered: { type: String, required: true },
    skillWanted: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SwapRequest", swapRequestSchema);
