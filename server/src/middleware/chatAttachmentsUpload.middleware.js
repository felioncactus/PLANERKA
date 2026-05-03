
import multer from "multer";
import { isSafeUploadMime } from "../utils/uploads.js";

export const chatAttachmentsUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!isSafeUploadMime(file)) return cb(new Error("File type is not allowed for attachments"));
    cb(null, true);
  },
});
