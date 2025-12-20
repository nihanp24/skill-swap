// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import getAvatarUrl from "../utils/getAvatarUrl";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    skills: "",
    avatarURL: "",
    avatarFile: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ---------------- Fetch Profile ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = id
          ? await API.get(`/users/${id}`)
          : await API.get(`/auth/me`, { withCredentials: true });
        const data = res.data.user || res.data;
        setProfile(data);
        if (!id) setUser(data);
      } catch (err) {
        console.error("❌ Failed to load profile:", err);
        setError("Failed to load profile.");
      }
    };
    fetchProfile();
  }, [id, setUser]);

  /* ---------------- Fill Form ---------------- */
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        bio: profile.bio || "",
        skills: Array.isArray(profile.skills)
          ? profile.skills.join(", ")
          : profile.skills || "",
        avatarURL: profile.avatarURL || "",
        avatarFile: null,
      });
    }
  }, [profile]);

  /* ---------------- Save Profile ---------------- */
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("bio", form.bio);
      fd.append("skills", form.skills);
      if (form.avatarFile) fd.append("avatar", form.avatarFile);
      if (form.avatarURL) fd.append("avatarURL", form.avatarURL);

      const res = await API.put(`/users/update`, fd, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updated = res.data.user;
      setProfile(updated);
      setUser(updated);
      setIsEditing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("❌ Failed to update profile:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to update profile. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="p-6">Loading profile...</div>;

  const isOwn =
    user && (user._id === profile._id || user.username === profile.username);

  /* ---------------- Render ---------------- */
  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <img
          src={getAvatarUrl(profile.avatarURL)}
          alt="avatar"
          onError={(e) => (e.target.src = "/default-avatar.png")}
          className="w-24 h-24 rounded-full object-cover border shadow-sm"
        />
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {profile.name || profile.username}
          </h2>
          <p className="text-gray-500">{profile.bio}</p>
        </div>

        {isOwn && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition"
          >
            Edit Profile
          </motion.button>
        )}
      </motion.div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <h3 className="text-lg font-medium text-gray-700">Skills</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {(Array.isArray(profile.skills) ? profile.skills : [])
            .filter((s) => s)
            .map((s, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {s}
              </span>
            ))}
        </div>
      </motion.div>

      {/* Edit Modal with Animation */}
      <AnimatePresence>
        {isEditing && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setIsEditing(false)}
            />

            {/* Modal */}
            <motion.form
              onSubmit={handleSave}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl relative">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Edit Profile
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, avatarFile: e.target.files[0] })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <label className="text-sm font-medium">
                    Or paste image URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={form.avatarURL}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        avatarURL: e.target.value,
                        avatarFile: null,
                      })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <label className="text-sm font-medium">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <label className="text-sm font-medium">Skills</label>
                  <input
                    value={form.skills}
                    onChange={(e) =>
                      setForm({ ...form, skills: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm mt-2 text-center">
                    {error}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-70"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg"
        >
          ✅ Profile updated
        </motion.div>
      )}
    </div>
  );
}
