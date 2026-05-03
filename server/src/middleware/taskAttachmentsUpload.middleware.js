import multer from "multer";
import { isSafeUploadMime, isUuid } from "../utils/uploads.js";

export const taskAttachmentsUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10,
  },
  fileFilter(req, file, cb) {
    if (!isUuid(req.params.id)) return cb(new Error("Invalid task id"));
    if (!isSafeUploadMime(file)) return cb(new Error("File type is not allowed for attachments"));
    cb(null, true);
  },
});
