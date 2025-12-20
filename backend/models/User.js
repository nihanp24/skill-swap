import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    avatarURL: { type: String, default: "/uploads/default-avatar.png" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
