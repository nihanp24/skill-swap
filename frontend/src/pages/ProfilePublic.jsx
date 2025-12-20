// src/pages/ProfilePublic.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useUser } from "../context/UserContext";

export default function ProfilePublic() {
  const { id } = useParams();
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🌐 Detect backend (LAN or localhost)
  const API_BASE = window.location.hostname.includes("192.168")
    ? `http://${window.location.hostname}:5000`
    : "http://localhost:5000";

  // ✅ Build correct avatar URL
  const buildAvatarUrl = (avatar) => {
    if (!avatar) return "/default-avatar.png";
    if (avatar.startsWith("http")) return avatar;
    // ensure no duplicate slashes
    return `${API_BASE.replace(/\/$/, "")}/${avatar.replace(/^\/+/, "")}`;
  };

  // ✅ Fetch public profile
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");

    axios
      .get(`${API_BASE}/api/users/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      .then((res) => {
        // Accept both shapes: { user: {...} } or {...}
        const payload = res.data?.user ? res.data.user : res.data;
        setProfile(payload);
      })
      .catch((err) => {
        console.error("❌ Error fetching profile:", err);
        setError("Failed to load profile");
      });
  }, [id]);

  if (error)
    return (
      <div className="p-6 text-red-500 text-center">
        {error}
        <div className="mt-4">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );

  if (!profile)
    return <div className="p-6 text-gray-500 text-center">Loading profile...</div>;

  const handleMessage = () => {
    if (!user || user._id === id) return;
    navigate(`/chat?user=${id}`);
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-6 max-w-lg mx-auto mt-10">
      <div className="flex flex-col items-center text-center">
        <img
          src={buildAvatarUrl(profile.avatarURL || profile.avatar)}
          alt={profile.name || profile.username}
          onError={(e) => (e.target.src = "/default-avatar.png")}
          className="w-32 h-32 rounded-full mb-4 object-cover border-4 border-blue-100"
        />
        <h2 className="text-2xl font-semibold text-gray-800">
          {profile.name || profile.username || "Unknown User"}
        </h2>
        {profile.bio && (
          <p className="text-gray-600 mt-2 max-w-xs italic">{profile.bio}</p>
        )}
        {Array.isArray(profile.skills) && profile.skills.length > 0 && (
          <p className="text-gray-500 mt-2">
            Skills: <b>{profile.skills.join(", ")}</b>
          </p>
        )}
        {user && user._id !== id && (
          <button
            onClick={handleMessage}
            className="mt-5 bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition"
          >
            Message
          </button>
        )}
      </div>
    </div>
  );
}
