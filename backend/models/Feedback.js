const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    swapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      required: true,
    },
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
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
