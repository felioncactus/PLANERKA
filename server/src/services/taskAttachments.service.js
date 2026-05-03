import path from "path";
import { notFound } from "../utils/httpError.js";
import { getTaskByIdForUser } from "../repositories/tasks.repo.js";
import {
  createTaskAttachment,
  deleteTaskAttachment,
  getTaskAttachmentById,
  listTaskAttachments,
} from "../repositories/taskAttachments.repo.js";
import { deleteUploadedFileById } from "../repositories/uploadedFiles.repo.js";
import { saveUploadedFile } from "./uploadedFiles.service.js";

function toPublicUrl(storedPath) {
  // storedPath is relative under uploads/, e.g. tasks/<taskId>/<file>
  return `/uploads/${storedPath.replace(/^\/+/, "")}`;
}

function serializeAttachment(a) {
  return { ...a, url: toPublicUrl(a.stored_path) };
}

export async function addAttachmentsToTask({ userId, taskId, files }) {
  if (!files || files.length === 0) return [];

  const task = await getTaskByIdForUser({ userId, taskId });
  if (!task) throw notFound("Task not found", "TASK_NOT_FOUND");

  const created = [];
  for (const f of files) {
    if (!f?.buffer) continue;

    const upload = await saveUploadedFile({ category: "tasks", ownerUserId: userId, file: f });
    if (!upload) continue;
    const storedPath = `tasks/${upload.id}/${path.basename(upload.original_filename || f.originalname || "file")}`;

    const row = await createTaskAttachment({
      userId,
      taskId,
      originalName: f.originalname,
      storedName: upload.id,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      storedPath,
    });
    created.push(serializeAttachment(row));
  }

  return created;
}

export async function listAttachmentsForTask({ userId, taskId }) {
  const task = await getTaskByIdForUser({ userId, taskId });
  if (!task) throw notFound("Task not found", "TASK_NOT_FOUND");

  const rows = await listTaskAttachments({ userId, taskId });
  return rows.map(serializeAttachment);
}

export async function removeAttachment({ userId, attachmentId }) {
  const existing = await getTaskAttachmentById({ userId, attachmentId });
  if (!existing) throw notFound("Attachment not found", "ATTACHMENT_NOT_FOUND");

  const deleted = await deleteTaskAttachment({ userId, attachmentId });
  if (!deleted) throw notFound("Attachment not found", "ATTACHMENT_NOT_FOUND");

  const uploadId = String(deleted.stored_path || "").split("/")[1];
  await deleteUploadedFileById(uploadId);

  return { id: deleted.id };
}
