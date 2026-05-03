import { Router } from "express";
import { getUploadedFileHandler } from "../controllers/uploads.controller.js";

export const uploadsRouter = Router();

uploadsRouter.get("/:category/:fileId/:filename", getUploadedFileHandler);
