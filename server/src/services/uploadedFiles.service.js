import path from "path";
import { createUploadedFile, deleteUploadedFilesByIds, getUploadedFileById } from "../repositories/uploadedFiles.repo.js";
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

export function extractUploadedFileIds(...values) {
  const ids = new Set();
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
  const publicUrlPattern = new RegExp(`/uploads/(?:courses|tasks|chat|notes)/(${uuid})(?:/|$)`, "gi");
  const storedPathPattern = new RegExp(`(?:^|/)(?:courses|tasks|chat|notes)/(${uuid})(?:/|$)`, "gi");

  for (const value of values.flat(Infinity)) {
    const text = String(value || "");
    for (const pattern of [publicUrlPattern, storedPathPattern]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        ids.add(match[1]);
      }
    }
  }

  return [...ids];
}

export async function deleteUploadedFilesReferencedBy(values, { ownerUserId = null } = {}) {
  const fileIds = extractUploadedFileIds(values);
  if (!fileIds.length) return [];
  return deleteUploadedFilesByIds({ fileIds, ownerUserId });
}
