import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

/* ---------------- Fix __dirname for ES Modules ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- Always save uploads to backend/public/uploads ---------------- */
const uploadDir = path.join(__dirname, "..", "public", "uploads");

// Create directory if missing
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ---------------- Multer Storage ---------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    // use req.user?._id to avoid crash when user is missing
    const userId = req.user?._id || "guest";

    const fileName = `user_${userId}_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

/* ---------------- Multer Config ---------------- */
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed!"));
    }
    cb(null, true);
  },
});

export default upload;
