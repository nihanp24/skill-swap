// src/components/ChatSidebar.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API from "../api";
import { useUser } from "../context/UserContext";
import getAvatarUrl from "../utils/getAvatarUrl";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function ChatSidebar() {
  const { user } = useUser();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({});
  const [params] = useSearchParams();
  const activeUserId = params.get("user");
  const navigate = useNavigate();

  /* ---------------- Load Initial Chat History ---------------- */
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?._id) return;
      try {
        const res = await API.get(`/messages/recent/${user._id}`);
        const list = res.data || [];

        // track unread
        const unreadMap = {};
        list.forEach((c) => {
          if (c.isRead === false) unreadMap[c.user._id] = true;
        });

        setUnread(unreadMap);
        setChats(
          list.map((c) => ({
            ...c.user,
            lastMessage: c.lastMessage,
            timestamp: c.timestamp,
          }))
        );
      } catch (err) {
        console.error("❌ Failed to load chat history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  /* ---------------- Real-Time Socket Updates ---------------- */
  useEffect(() => {
    if (!user?._id) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.emit("join_room", user._id);

    socket.on("receiveMessage", (msg) => {
      if (msg.sender === user._id || msg.receiver === user._id) {
        const otherId = msg.sender === user._id ? msg.receiver : msg.sender;

        setChats((prev) => {
          const existing = prev.find((c) => c._id === otherId);

          if (existing) {
            const updated = prev.map((c) =>
              c._id === otherId
                ? { ...c, lastMessage: msg.message, timestamp: msg.timestamp }
                : c
            );
            updated.sort(
              (a, b) =>
                new Date(b.timestamp || 0).getTime() -
                new Date(a.timestamp || 0).getTime()
            );
            return updated;
          } else {
            API.get(`/users/${otherId}`).then((res) => {
              const newUser = res.data.user || res.data;
              setChats((p) => [
                {
                  ...newUser,
                  lastMessage: msg.message,
                  timestamp: msg.timestamp,
                },
                ...p,
              ]);
            });
            return prev;
          }
        });
      }
    });

    // 🔔 notification popup for unread
    socket.on("newMessageNotification", async ({ from, text }) => {
      if (from !== activeUserId) {
        setUnread((prev) => ({ ...prev, [from]: true }));
        const senderInfo = await API.get(`/users/${from}`);
        toast.info(
          `💬 New message from ${senderInfo.data.user?.name || "Someone"}: ${text}`,
          { position: "bottom-right", autoClose: 3000 }
        );
      }
    });

    return () => socket.disconnect();
  }, [user, activeUserId]);

  /* ---------------- Mark Read When Chat Opened ---------------- */
  useEffect(() => {
    if (!activeUserId || !user?._id) return;
    const markAsRead = async () => {
      await API.patch(`/messages/read/${activeUserId}/${user._id}`);
      setUnread((prev) => ({ ...prev, [activeUserId]: false }));
    };
    markAsRead();
  }, [activeUserId, user]);

  /* ---------------- Render ---------------- */
  if (loading)
    return <div className="p-4 text-gray-500">Loading chats...</div>;

  return (
    <div className="border-r w-full sm:w-64 h-full overflow-y-auto bg-white relative">
      <ToastContainer />
      <div className="p-4 border-b font-semibold text-lg">Messages</div>
      <div className="flex flex-col">
        {chats.length === 0 ? (
          <p className="text-gray-500 text-center mt-6">No recent chats</p>
        ) : (
          chats.map((c) => (
            <div
              key={c._id}
              onClick={() => navigate(`/chat?user=${c._id}`)}
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 transition relative ${
                activeUserId === c._id ? "bg-gray-100" : ""
              }`}
            >
              <img
                src={getAvatarUrl(c.avatarURL)}
                alt={c.username}
                onError={(e) => (e.target.src = "/default-avatar.png")}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <div className="flex flex-col w-40">
                <span className="font-medium text-sm truncate">
                  {c.name || c.username}
                </span>
                {c.lastMessage ? (
                  <span className="text-xs text-gray-500 truncate">
                    {c.lastMessage}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    No messages yet
                  </span>
                )}
              </div>

              {/* 🔴 Unread Dot */}
              {unread[c._id] && (
                <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
