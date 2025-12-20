// src/utils/getAvatarUrl.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Returns a full avatar URL, no matter what kind of avatar it is.
 * - Local uploads → adds backend base (http://localhost:5000/uploads/...)
 * - External URLs → returns as-is
 * - Missing avatars → returns default image
 */
export default function getAvatarUrl(avatarPath) {
  if (!avatarPath) return "/default-avatar.png";

  // External links (http or https)
  if (avatarPath.startsWith("http")) return avatarPath;

  // Local uploads (starts with /uploads)
  if (avatarPath.startsWith("/uploads"))
    return `${API_URL.replace(/\/$/, "")}${avatarPath}`;

  // Default fallback
  return "/default-avatar.png";
}
