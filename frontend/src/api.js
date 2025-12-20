// frontend/src/api.js
import axios from "axios";

// ✅ Compute and normalize the base URL
let BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Ensure it ends with /api once
if (!BASE_URL.endsWith("/api")) BASE_URL += "/api";

console.log("🌐 API Base URL:", BASE_URL);

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ Needed for auth cookies or JWTs
});

// ✅ Attach token for all requests
API.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;

      // Don’t overwrite multipart/form-data
      if (!(config.data instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
      }
    } catch (err) {
      console.warn("⚠️ Unable to read token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle unauthorized globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      console.warn("⚠️ Auth expired or unauthorized, redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default API;
