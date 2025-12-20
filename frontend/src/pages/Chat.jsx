// src/pages/Chat.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api";
import { useUser } from "../context/UserContext";
import getAvatarUrl from "../utils/getAvatarUrl";
import ChatSidebar from "../components/ChatSidebar";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function Chat() {
  const [params] = useSearchParams();
  const userParam = params.get("user");
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const scrollRef = useRef();
  const refreshRef = useRef(null);

  /* ---------------- SOCKET CONNECTION ---------------- */
  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current.emit("join_room", user._id);

    socketRef.current.on("receiveMessage", (msg) => {
      if (
        (msg.sender === user._id && msg.receiver === userParam) ||
        (msg.sender === userParam && msg.receiver === user._id)
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m._id) === String(msg._id));
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?._id, userParam]);

  /* ---------------- LOAD RECEIVER + HISTORY ---------------- */
  const fetchChat = async () => {
    if (!user?._id || !userParam) return;
    try {
      const res = await API.get(`/messages/${user._id}/${userParam}`);
      setMessages(res.data || []);
      // mark as read after fetching
      await API.put("/messages/mark-read", {
        userId: user._id,
        otherId: userParam,
      });
    } catch (err) {
      console.error("❌ Fetch chat error:", err);
    }
  };

  useEffect(() => {
    const loadReceiver = async () => {
      if (!userParam) {
        setReceiver(null);
        setMessages([]);
        return;
      }
      try {
        const res = await API.get(`/users/${userParam}`);
        setReceiver(res.data.user || res.data);
        await fetchChat();
      } catch (err) {
        console.error("❌ Chat load error:", err);
        setError("Failed to load chat");
      }
    };
    loadReceiver();
  }, [userParam, user?._id]);

  /* ---------------- AUTO-REFRESH EVERY SECOND ---------------- */
  useEffect(() => {
    if (!userParam) return;
    refreshRef.current = setInterval(fetchChat, 4000);
    return () => clearInterval(refreshRef.current);
  }, [userParam, user?._id]);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = {
      sender: user._id,
      receiver: userParam,
      message: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setText("");
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("sendMessage", msg);
      } else {
        await API.post("/messages", msg);
      }
      await fetchChat();
    } catch (err) {
      console.error("❌ Send error:", err);
    }
  };

  /* ---------------- FORMAT TIME ---------------- */
  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  /* ---------------- RENDER ---------------- */
  return (
    <div className="flex h-[calc(100vh-80px)]">
      <div className="hidden sm:block w-64 border-r bg-white">
        <ChatSidebar />
      </div>

      <div className="flex-1 p-6 flex flex-col max-w-4xl mx-auto">
        {receiver ? (
          <>
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-4 border-b pb-2">
              <img
                src={getAvatarUrl(receiver.avatarURL)}
                alt="avatar"
                onError={(e) => (e.target.src = "/default-avatar.png")}
                className="w-10 h-10 rounded-full object-cover border"
              />
              <h2 className="text-lg font-semibold">
                {receiver.name || receiver.username}
              </h2>
            </div>

            {/* MESSAGES */}
            <div className="border rounded p-4 flex-1 overflow-auto flex flex-col gap-3 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 mt-4">No messages yet</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={m._id || i}
                    ref={i === messages.length - 1 ? scrollRef : null}
                    className={`flex flex-col ${
                      m.sender === user._id ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-end gap-2">
                      {m.sender !== user._id && (
                        <img
                          src={getAvatarUrl(receiver?.avatarURL)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border"
                        />
                      )}
                      <div
                        className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                          m.sender === user._id
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {m.message}
                      </div>
                      {m.sender === user._id && (
                        <img
                          src={getAvatarUrl(user?.avatarURL)}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border"
                        />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1 mx-2 flex gap-2">
                      <span>{formatTime(m.timestamp)}</span>
                      {m.sender === user._id && m.isRead && (
                        <span className="text-green-600 font-medium">Seen</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* INPUT */}
            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border p-2 rounded"
                placeholder="Type a message..."
              />
              <button
                onClick={handleSend}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
