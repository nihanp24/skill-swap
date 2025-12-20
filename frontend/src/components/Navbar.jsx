import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { useUser } from "../context/UserContext";
import getAvatarUrl from "../utils/getAvatarUrl";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  /* ---------------- SOCKET: Real-Time Message Notification ---------------- */
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socket.emit("join_room", user._id);

    socket.on("receiveMessage", (msg) => {
      // Increment badge only if user not on chat page
      if (!location.pathname.includes("/chat")) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => socket.disconnect();
  }, [user?._id, location.pathname]);

  // Reset unread badge when visiting chat
  useEffect(() => {
    if (location.pathname.includes("/chat")) setUnreadCount(0);
  }, [location.pathname]);

  /* ---------------- NAV LINKS ---------------- */
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/profile", label: "Profile" },
    { path: "/chat", label: "Chat" },
  ];

  /* ---------------- RENDER ---------------- */
  return (
    <nav className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
      {/* 🧩 Brand / Logo */}
      <h1
        onClick={() => navigate("/dashboard")}
        className="text-xl font-bold cursor-pointer text-indigo-600"
      >
        TalentTrade
      </h1>

      {/* 🧭 Navigation + User Info */}
      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <div key={item.path} className="relative">
            <Link
              to={item.path}
              className={`${
                location.pathname === item.path
                  ? "text-indigo-600 font-semibold"
                  : "text-gray-700"
              } hover:text-indigo-600 transition`}
            >
              {item.label}
            </Link>

            {/* 🔴 Unread Message Badge for Chat */}
            {item.path === "/chat" && unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        ))}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-300 mx-2" />

        {/* 👤 User Info */}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">
              Welcome,{" "}
              <span className="font-semibold text-indigo-600">
                {user.name || user.username}
              </span>
            </span>
            <img
              src={getAvatarUrl(user.avatarURL)}
              alt="avatar"
              onError={(e) => (e.target.src = "/default-avatar.png")}
              loading="lazy"
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
            />
          </div>
        ) : (
          <span className="text-gray-500 text-sm">Loading...</span>
        )}

        {/* 🚪 Logout */}
        <button
          onClick={logout}
          className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
