const mongoose = require("mongoose");

const reportedMessageSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "inappropriate_content",
        "scam",
        "offensive_language",
        "other",
      ],
      required: true,
    },
    additionalDetails: {
      type: String,
      maxlength: 500,
    },
    messageContent: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "action_taken", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for admin queries
reportedMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ReportedMessage", reportedMessageSchema);
