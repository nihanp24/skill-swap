// backend/routes/users.js
import express from "express";
import path from "path";
import fs from "fs";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import upload from "../middleware/uploadAvatar.js";  // ✅ USE THE CENTRAL MULTER CONFIG
import { fileURLToPath } from "url";

const router = express.Router();

// Needed to calculate real backend path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- GET all users (Protected) ---------------- */
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await User.find(
      {},
      "name username email bio avatarURL skills createdAt"
    ).sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- GET single user (Public) ---------------- */
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name username email bio avatarURL skills createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("❌ Error fetching single user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- UPDATE profile (Protected) ---------------- */
router.put("/update", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    const { name, bio, skills, avatarURL } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    /* --------- If a file was uploaded --------- */
    if (req.file) {
      // Remove old file (only if it was a local upload)
      if (user.avatarURL && user.avatarURL.startsWith("/uploads/")) {
        const oldPath = path.join(__dirname, "..", "public", user.avatarURL);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      user.avatarURL = `/uploads/${req.file.filename}`;
    }

    /* --------- If user pasted an image URL --------- */
    else if (avatarURL && avatarURL.startsWith("http")) {
      user.avatarURL = avatarURL;
    }

    /* --------- Other fields --------- */
    if (name) user.name = name;
    if (bio) user.bio = bio;

    if (skills) {
      user.skills = Array.isArray(skills)
        ? skills
        : skills.split(",").map((s) => s.trim());
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatarURL: user.avatarURL,
        skills: user.skills,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ message: "Server error while updating profile" });
  }
});

export default router;
