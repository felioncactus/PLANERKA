import path from "path";

const MIME_BY_EXT = new Map([
  [".jpg", new Set(["image/jpeg"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".png", new Set(["image/png"])],
  [".webp", new Set(["image/webp"])],
  [".gif", new Set(["image/gif"])],
  [".pdf", new Set(["application/pdf"])],
  [".txt", new Set(["text/plain"])],
  [".md", new Set(["text/markdown", "text/plain"])],
  [".csv", new Set(["text/csv", "application/vnd.ms-excel"])],
  [".doc", new Set(["application/msword"])],
  [".docx", new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])],
  [".xls", new Set(["application/vnd.ms-excel"])],
  [".xlsx", new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])],
  [".ppt", new Set(["application/vnd.ms-powerpoint"])],
  [".pptx", new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"])],
  [".zip", new Set(["application/zip", "application/x-zip-compressed"])],
]);

export const SAFE_ATTACHMENT_EXTS = new Set(MIME_BY_EXT.keys());
export const SAFE_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export function isSafeUploadName(name, allowedExts = SAFE_ATTACHMENT_EXTS) {
  const ext = path.extname(name || "").toLowerCase();
  return allowedExts.has(ext);
}

export function isSafeUploadMime(file, allowedExts = SAFE_ATTACHMENT_EXTS) {
  const ext = path.extname(file?.originalname || "").toLowerCase();
  if (!allowedExts.has(ext)) return false;
  const allowedMimes = MIME_BY_EXT.get(ext);
  if (!allowedMimes) return false;
  return allowedMimes.has(file?.mimetype || "");
}

export function assertPathInside(parent, target) {
  const relative = path.relative(parent, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Upload path escaped the uploads directory");
  }
}

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
