import { z } from "zod";
import { badRequest, notFound } from "../utils/httpError.js";
import { getCourseByIdForUser } from "../repositories/courses.repo.js";
import {
  listCourseNotesForCourse,
  getCourseNoteByIdForUser,
  createCourseNote,
  updateCourseNote,
  deleteCourseNote,
} from "../repositories/courseNotes.repo.js";
import { deleteUploadedFilesReferencedBy, extractUploadedFileIds, saveUploadedFile } from "./uploadedFiles.service.js";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  contentHtml: z.string().max(2_000_000).optional().default(""),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  contentHtml: z.string().max(2_000_000).optional(),
});

function serializeNote(note) {
  if (!note) return note;
  return {
    ...note,
    content_html: note.content_html ?? "",
  };
}

async function assertCourseOwnership(userId, courseId) {
  const course = await getCourseByIdForUser({ userId, courseId });
  if (!course) throw notFound("Course not found", "COURSE_NOT_FOUND");
  return course;
}

export async function listNotesForCourse(userId, courseId) {
  await assertCourseOwnership(userId, courseId);
  const notes = await listCourseNotesForCourse({ userId, courseId });
  return notes.map(serializeNote);
}

export async function getNoteForUser(userId, noteId) {
  const note = await getCourseNoteByIdForUser({ userId, noteId });
  if (!note) throw notFound("Note not found", "NOTE_NOT_FOUND");
  return serializeNote(note);
}

export async function createNoteForCourse(userId, courseId, input) {
  await assertCourseOwnership(userId, courseId);
  const parsed = createSchema.safeParse({
    title: input?.title,
    contentHtml: input?.contentHtml ?? input?.content_html ?? "",
  });

  if (!parsed.success) {
    throw badRequest("Invalid note payload", "VALIDATION_ERROR");
  }

  const note = await createCourseNote({
    userId,
    courseId,
    title: parsed.data.title,
    contentHtml: parsed.data.contentHtml,
  });

  return serializeNote(note);
}

export async function updateNoteForUser(userId, noteId, input) {
  const existing = await getCourseNoteByIdForUser({ userId, noteId });
  if (!existing) throw notFound("Note not found", "NOTE_NOT_FOUND");

  const parsed = updateSchema.safeParse({
    title: input?.title,
    contentHtml: input?.contentHtml ?? input?.content_html,
  });

  if (!parsed.success || (!parsed.data.title && parsed.data.contentHtml === undefined)) {
    throw badRequest("Invalid note payload", "VALIDATION_ERROR");
  }

  const note = await updateCourseNote({
    userId,
    noteId,
    title: parsed.data.title,
    contentHtml: parsed.data.contentHtml,
  });

  if (!note) throw notFound("Note not found", "NOTE_NOT_FOUND");
  if (parsed.data.contentHtml !== undefined) {
    const beforeIds = extractUploadedFileIds(existing.content_html);
    const afterIds = new Set(extractUploadedFileIds(note.content_html));
    const removedIds = beforeIds.filter((id) => !afterIds.has(id));
    await deleteUploadedFilesReferencedBy(removedIds.map((id) => `/uploads/notes/${id}/file`), { ownerUserId: userId });
  }
  return serializeNote(note);
}

export async function deleteNoteForUser(userId, noteId) {
  const existing = await getCourseNoteByIdForUser({ userId, noteId });
  if (!existing) throw notFound("Note not found", "NOTE_NOT_FOUND");

  const deleted = await deleteCourseNote({ userId, noteId });
  if (!deleted) throw notFound("Note not found", "NOTE_NOT_FOUND");
  await deleteUploadedFilesReferencedBy([existing.content_html], { ownerUserId: userId });
}

export async function uploadNoteImageForUser(userId, noteId, file) {
  const note = await getCourseNoteByIdForUser({ userId, noteId });
  if (!note) throw notFound("Note not found", "NOTE_NOT_FOUND");
  const uploaded = await saveUploadedFile({ category: "notes", ownerUserId: userId, file });
  if (!uploaded) throw badRequest("Image is required", "VALIDATION_ERROR");
  return uploaded;
}
