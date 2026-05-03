import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listCourseNotesHandler,
  getCourseNoteHandler,
  createCourseNoteHandler,
  updateCourseNoteHandler,
  deleteCourseNoteHandler,
  uploadNoteImageHandler,
} from "../controllers/courseNotes.controller.js";
import { courseUpload } from "../middleware/upload.middleware.js";

export const courseNotesRouter = Router();

courseNotesRouter.use(requireAuth);

courseNotesRouter.get("/courses/:courseId/notes", listCourseNotesHandler);
courseNotesRouter.post("/courses/:courseId/notes", createCourseNoteHandler);
courseNotesRouter.get("/notes/:noteId", getCourseNoteHandler);
courseNotesRouter.put("/notes/:noteId", updateCourseNoteHandler);
courseNotesRouter.post("/notes/:noteId/images", courseUpload.single("image"), uploadNoteImageHandler);
courseNotesRouter.delete("/notes/:noteId", deleteCourseNoteHandler);
