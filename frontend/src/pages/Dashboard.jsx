import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api";
import getAvatarUrl from "../utils/getAvatarUrl";
import PageWrapper from "../components/PageWrapper";

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // ✅ Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/users");
        setUsers(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch users:", err);
        setError("Failed to load users. Please re-login.");
      }
    };
    fetchUsers();
  }, []);

  // ✅ Filter users by search
  const filteredUsers = useMemo(() => {
    const lower = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(lower) ||
        u.username?.toLowerCase().includes(lower) ||
        (Array.isArray(u.skills) &&
          u.skills.some((s) => s.toLowerCase().includes(lower)))
    );
  }, [users, search]);

  if (error)
    return (
      <PageWrapper>
        <div className="p-6 text-center text-red-600 font-medium">{error}</div>
      </PageWrapper>
    );

  return (
    <PageWrapper>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="p-6 max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Discover Talents 🌟
          </h1>
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <p className="text-gray-500 text-center mt-8">
            No users found. Try a different search.
          </p>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
          >
            {filteredUsers.map((u, i) => (
              <motion.div
                key={u._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="p-5 bg-white border rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getAvatarUrl(u.avatarURL)}
                    alt="avatar"
                    onError={(e) => (e.target.src = "/default-avatar.png")}
                    className="w-16 h-16 rounded-full object-cover border shadow-sm"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-800">
                      {u.name || u.username}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {u.bio || "No bio provided"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(u.skills || []).map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/profile/${u._id}`)}
                    className="px-3 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200 transition"
                  >
                    View
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/chat?user=${u._id}`)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded hover:bg-indigo-200 transition"
                  >
                    Message
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
