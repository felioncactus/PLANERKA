import { asyncHandler } from "../utils/asyncHandler.js";
import { getPublicUploadedFile } from "../services/uploadedFiles.service.js";

export const getUploadedFileHandler = asyncHandler(async (req, res) => {
  const file = await getPublicUploadedFile({
    category: req.params.category,
    fileId: req.params.fileId,
  });

  res.setHeader("Content-Type", file.mime_type);
  res.setHeader("Content-Length", String(file.size_bytes));
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Disposition", `inline; filename="${String(file.original_filename).replace(/"/g, "")}"`);
  res.send(file.data);
});
