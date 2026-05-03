
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateStatsInsightForUser, getStatsForUser } from "../services/stats.service.js";

export const getStatsHandler = asyncHandler(async (req, res) => {
  const stats = await getStatsForUser(req.user.id);
  res.json({ stats });
});

export const generateStatsInsightHandler = asyncHandler(async (req, res) => {
  const result = await generateStatsInsightForUser(req.user.id);
  res.json(result);
});
