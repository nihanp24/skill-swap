// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2️⃣ If not found, check cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hanan_secret");

    // 4️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    // 5️⃣ Attach to request
    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};
