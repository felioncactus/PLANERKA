import { asyncHandler } from "../utils/asyncHandler.js";
import { saveUploadedFile } from "../services/uploadedFiles.service.js";
import {
  listCourses,
  getCourseForUser,
  createCourseForUser,
  updateCourseForUser,
  deleteCourseForUser,
} from "../services/courses.service.js";

async function pickUploadedUrls(req) {
  const files = req.files || {};
  const image = Array.isArray(files.image) ? files.image[0] : null;
  const banner = Array.isArray(files.banner) ? files.banner[0] : null;

  const imageUpload = image ? await saveUploadedFile({ category: "courses", ownerUserId: req.user.id, file: image }) : null;
  const bannerUpload = banner ? await saveUploadedFile({ category: "courses", ownerUserId: req.user.id, file: banner }) : null;

  const out = {};
  if (imageUpload) out.imageUrl = imageUpload.url;
  if (bannerUpload) out.bannerUrl = bannerUpload.url;
  return out;
}

export const listCoursesHandler = asyncHandler(async (req, res) => {
  const courses = await listCourses(req.user.id);
  res.json({ courses });
});

export const getCourseHandler = asyncHandler(async (req, res) => {
  const course = await getCourseForUser(req.user.id, req.params.id);
  res.json({ course });
});

export const createCourseHandler = asyncHandler(async (req, res) => {
  const uploaded = await pickUploadedUrls(req);
  const course = await createCourseForUser(req.user.id, { ...req.body, ...uploaded });
  res.status(201).json({ course });
});

export const updateCourseHandler = asyncHandler(async (req, res) => {
  const uploaded = await pickUploadedUrls(req);
  const course = await updateCourseForUser(req.user.id, req.params.id, { ...req.body, ...uploaded });
  res.json({ course });
});

export const deleteCourseHandler = asyncHandler(async (req, res) => {
  await deleteCourseForUser(req.user.id, req.params.id);
  res.status(204).send();
});
