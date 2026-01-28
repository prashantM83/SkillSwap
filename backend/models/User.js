const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: String,
    profilePhoto: String,
    skillsOffered: [String],
    skillsWanted: [String],
    availability: [String],
    refreshTokens: { type: [String], default: [] },

    isPublic: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalSwaps: { type: Number, default: 0 },
    joinDate: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
