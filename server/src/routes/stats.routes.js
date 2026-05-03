
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rateLimit.middleware.js";
import { generateStatsInsightHandler, getStatsHandler } from "../controllers/stats.controller.js";

export const statsRouter = Router();
const insightLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many AI insight requests. Please try again later.",
});

statsRouter.use(requireAuth);
statsRouter.get("/", getStatsHandler);
statsRouter.post("/insight", insightLimiter, generateStatsInsightHandler);
