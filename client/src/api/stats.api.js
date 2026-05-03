
import { http } from "./http";

export async function apiGetStats() {
  const res = await http.get("/stats");
  return res.data; // { stats }
}

export async function apiGenerateStatsInsight() {
  const res = await http.post("/stats/insight");
  return res.data; // { insight, source, cached }
}
