// -------------------- Imports --------------------
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; // ✅ Needed for JWT auth via cookies
import { fileURLToPath } from "url";

// Models
import Chat from "./chatModel.js";
import User from "./models/User.js";

// Routes
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import messageRoutes from "./routes/messages.js";

// -------------------- Environment --------------------
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------------------- Express + HTTP + Socket Setup --------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// -------------------- Middleware --------------------
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    credentials: true,
  })
);

// Increase JSON limit to prevent body too large errors
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Basic request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// -------------------- MongoDB Connection --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// -------------------- Static File Serving --------------------
// ✅ Serve uploaded avatars correctly
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ✅ Serve other static assets (like default-avatar.png)
app.use("/public", express.static(path.join(__dirname, "public")));

// -------------------- API Routes --------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/messages", messageRoutes);

// -------------------- Health Check --------------------
app.get("/health", (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// -------------------- Socket.IO Chat Logic --------------------
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("join_room", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
    console.log(`👤 User ${userId} joined (${socket.id})`);
  });

  socket.on("sendMessage", async (msg) => {
    try {
      const { sender, receiver, message } = msg;
      if (!sender || !receiver || !message) return;

      const newChat = new Chat({ sender, receiver, message });
      await newChat.save();

      const receiverSocketId = onlineUsers.get(receiver);
      if (receiverSocketId) io.to(receiverSocketId).emit("receiveMessage", newChat);

      io.to(socket.id).emit("receiveMessage", newChat);
    } catch (err) {
      console.error("❌ Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    for (const [userId, id] of onlineUsers.entries()) {
      if (id === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// -------------------- Catch-All for Unknown Routes --------------------
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`🖼️  Serving uploads from: ${path.join(__dirname, "public", "uploads")}`);
});
