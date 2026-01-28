const mongoose = require("mongoose");

const adminMessageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "update", "maintenance"],
      default: "info",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminMessage", adminMessageSchema);
