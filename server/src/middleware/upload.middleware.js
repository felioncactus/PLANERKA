import multer from "multer";
import { isSafeUploadMime, SAFE_IMAGE_EXTS } from "../utils/uploads.js";

export const courseUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!isSafeUploadMime(file, SAFE_IMAGE_EXTS)) {
      return cb(new Error("Only JPG, PNG, WebP, or GIF image uploads are allowed"));
    }
    cb(null, true);
  },
});
