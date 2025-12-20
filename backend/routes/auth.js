// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* ---------------- Utility: create and send JWT ---------------- */
const sendTokenResponse = (user, res) => {
  const token = jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // ✅ Set secure HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      skills: user.skills,
      avatarURL: user.avatarURL,
    },
  });
};

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash: hash,
      name,
    });

    sendTokenResponse(user, res);
  } catch (err) {
    console.error("❌ Register error:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

/* ---------------- LOGIN ---------------- */
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const user = await User.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid password" });

    sendTokenResponse(user, res);
  } catch (err) {
    console.error("❌ Login error:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ---------------- LOGOUT ---------------- */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

/* ---------------- CURRENT USER ---------------- */
router.get("/me", async (req, res) => {
  try {
    // ✅ Prefer cookie token
    let token = req.cookies?.token;

    // ✅ Fallback to Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        skills: user.skills,
        avatarURL: user.avatarURL,
      },
    });
  } catch (err) {
    console.error("❌ /me error:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

export default router;
