const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    swapRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      required: true,
    },
    hostUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guestUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
      min: 15,
      max: 480,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    meetingLink: {
      type: String,
      maxlength: 500,
    },
    meetingType: {
      type: String,
      enum: ["external", "jitsi", "in-person"],
      default: "external",
    },
    jitsiRoomId: {
      type: String,
    },
    location: {
      type: String,
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    reminder24hSent: {
      type: Boolean,
      default: false,
    },
    reminder1hSent: {
      type: Boolean,
      default: false,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cancelReason: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
sessionSchema.index({ scheduledAt: 1 });
sessionSchema.index({ hostUserId: 1, scheduledAt: 1 });
sessionSchema.index({ guestUserId: 1, scheduledAt: 1 });
sessionSchema.index({ swapRequestId: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

// Generate Jitsi room ID
sessionSchema.methods.generateJitsiRoomId = function () {
  const roomId = `skillswap-${this._id.toString().slice(-8)}-${Date.now().toString(36)}`;
  this.jitsiRoomId = roomId;
  return roomId;
};

// Check if session is starting soon (within 15 minutes)
sessionSchema.methods.isStartingSoon = function () {
  const now = new Date();
  const sessionTime = new Date(this.scheduledAt);
  const diffMinutes = (sessionTime - now) / (1000 * 60);
  return diffMinutes <= 15 && diffMinutes >= -this.duration;
};

// Check if session is in the past
sessionSchema.methods.isPast = function () {
  const now = new Date();
  const endTime = new Date(this.scheduledAt);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  return now > endTime;
};

module.exports = mongoose.model("Session", sessionSchema);
