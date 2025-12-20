// src/components/UsersList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import getAvatarUrl from "../utils/getAvatarUrl";

export default function UsersList({ users = [] }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      {users.map((u) => (
        <div
          key={u._id}
          className="flex items-center gap-3 p-3 border rounded hover:bg-gray-50 transition"
        >
          <img
            src={getAvatarUrl(u.avatarURL)}
            alt="avatar"
            onError={(e) => (e.target.src = "/default-avatar.png")}
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div className="flex-1">
            <div className="font-medium">{u.name || u.username}</div>
            <div className="text-xs text-gray-500 truncate">{u.bio}</div>
          </div>
          <button
            onClick={() => navigate(`/chat?user=${u._id}`)}
            className="px-2 py-1 bg-green-100 text-xs rounded hover:bg-green-200"
          >
            Message
          </button>
        </div>
      ))}
    </div>
  );
}
