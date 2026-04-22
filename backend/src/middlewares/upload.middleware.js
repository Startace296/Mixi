import multer from "multer";

import { AppError } from "../utils/app-error.js";

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg"]);

const storage = multer.memoryStorage();

export const avatarUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError("Only PNG and JPEG images are allowed", 400));
    }

    return cb(null, true);
  },
});
