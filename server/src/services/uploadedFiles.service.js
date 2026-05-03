import path from "path";
import { createUploadedFile, getUploadedFileById } from "../repositories/uploadedFiles.repo.js";
import { notFound } from "../utils/httpError.js";

function sanitizeUrlPart(value) {
  const base = path.basename(value || "file").replace(/[/\\?%*:|"<>#]/g, "_").trim();
  return encodeURIComponent(base || "file");
}

export function buildUploadedFileUrl(file) {
  return `/uploads/${file.category}/${file.id}/${sanitizeUrlPart(file.original_filename)}`;
}

export async function saveUploadedFile({ category, ownerUserId, file }) {
  if (!file?.buffer) return null;
  const row = await createUploadedFile({
    category,
    ownerUserId,
    originalFilename: file.originalname || "file",
    mimeType: file.mimetype || "application/octet-stream",
    sizeBytes: file.size || file.buffer.length || 0,
    data: file.buffer,
  });
  return {
    ...row,
    url: buildUploadedFileUrl(row),
  };
}

export async function getPublicUploadedFile({ category, fileId }) {
  const file = await getUploadedFileById({ category, fileId });
  if (!file) throw notFound("File not found", "FILE_NOT_FOUND");
  return file;
}
