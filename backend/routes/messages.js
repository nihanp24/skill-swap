// backend/routes/messages.js
import express from "express";
import mongoose from "mongoose";
import Chat from "../chatModel.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/* ---------------- Get Recent Chats (Sidebar Preview) ---------------- */
router.get("/recent/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Validate userId before using it
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // ✅ Aggregate to get last message from each conversation
    const recentChats = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$message" },
          timestamp: { $first: "$timestamp" },
          isRead: { $first: "$isRead" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          user: {
            _id: 1,
            name: 1,
            username: 1,
            avatarURL: 1,
          },
          lastMessage: 1,
          timestamp: 1,
          isRead: 1,
        },
      },
      { $sort: { timestamp: -1 } },
    ]);

    res.json(recentChats);
  } catch (err) {
    console.error("❌ Error fetching recent chats:", err);
    res.status(500).json({ error: "Failed to load recent chats" });
  }
});

/* ---------------- Get Chat History (Unique Users) ---------------- */
router.get("/history/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).lean();

    const uniqueUserIds = [
      ...new Set(
        messages.map((m) =>
          m.sender.toString() === userId
            ? m.receiver.toString()
            : m.sender.toString()
        )
      ),
    ];

    const chatUsers = await User.find({ _id: { $in: uniqueUserIds } })
      .select("name username bio avatarURL")
      .lean();

    res.json(chatUsers);
  } catch (err) {
    console.error("❌ Error fetching chat history:", err);
    res.status(500).json({ error: "Error fetching chat history" });
  }
});

/* ---------------- Get All Messages Between Two Users ---------------- */
router.get("/:sender/:receiver", requireAuth, async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(sender) ||
      !mongoose.Types.ObjectId.isValid(receiver)
    ) {
      return res.status(400).json({ error: "Invalid sender or receiver ID" });
    }

    const messages = await Chat.find({
      $or: [
        { sender, receiver },
        { sender: receiver, receiver: sender },
      ],
    })
      .sort({ timestamp: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

/* ---------------- Send New Message ---------------- */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newChat = new Chat({
      sender,
      receiver,
      message,
      timestamp: new Date(),
      isRead: false, // 👈 Mark new messages as unread
    });

    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    console.error("❌ Error saving message:", err);
    res.status(500).json({ error: "Error saving message" });
  }
});

/* ---------------- Mark Messages as Read ---------------- */
router.patch("/read/:sender/:receiver", requireAuth, async (req, res) => {
  try {
    const { sender, receiver } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(sender) ||
      !mongoose.Types.ObjectId.isValid(receiver)
    ) {
      return res.status(400).json({ error: "Invalid sender or receiver ID" });
    }

    await Chat.updateMany(
      { sender, receiver, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking messages as read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

/* ---------------- Mark Messages as Read ---------------- */
router.put("/mark-read", requireAuth, async (req, res) => {
  try {
    const { userId, otherId } = req.body;
    if (!userId || !otherId)
      return res.status(400).json({ error: "Missing userId or otherId" });

    await Chat.updateMany(
      { sender: otherId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error marking messages read:", err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default router;
