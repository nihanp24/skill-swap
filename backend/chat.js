// backend/chat.js
import { Server } from "socket.io";
import Chat from "./chatModel.js";
import User from "./models/User.js";

export default function attachChat(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const onlineUsers = new Map(); // userId → socketId

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // user joins their own room
    socket.on("join_room", (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      console.log(`👤 User ${userId} joined`);
    });

    // send message
    socket.on("sendMessage", async (msg) => {
      try {
        const { sender, receiver, message } = msg;
        if (!sender || !receiver || !message) return;

        // Save message to DB (marked unread)
        const newChat = new Chat({
          sender,
          receiver,
          message,
          timestamp: new Date(),
          isRead: false,
        });
        await newChat.save();

        // Send to receiver (real-time)
        const receiverSocketId = onlineUsers.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receiveMessage", newChat);

          // Send a small notification popup
          io.to(receiverSocketId).emit("newMessageNotification", {
            from: sender,
            text: message,
            chatId: newChat._id,
          });
        }

        // Echo to sender
        io.to(socket.id).emit("receiveMessage", newChat);
      } catch (err) {
        console.error("❌ Socket message error:", err);
      }
    });

    // mark messages as read
    socket.on("markAsRead", async ({ sender, receiver }) => {
      try {
        await Chat.updateMany(
          { sender, receiver, isRead: false },
          { $set: { isRead: true } }
        );
      } catch (err) {
        console.error("❌ Error marking messages as read:", err);
      }
    });

    // cleanup on disconnect
    socket.on("disconnect", () => {
      for (const [userId, id] of onlineUsers.entries()) {
        if (id === socket.id) {
          onlineUsers.delete(userId);
          console.log(`🔴 User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  console.log("✅ Chat socket initialized");
}
