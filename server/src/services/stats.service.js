
import { getProductivityStats } from "../repositories/stats.repo.js";
import { findUserById } from "../repositories/users.repo.js";
import { getOpenAIModel, OPENAI_API_URL } from "../config/openai.js";

const INSIGHT_CACHE_TTL_MS = 60 * 60 * 1000;
const insightCache = new Map();

function canUseAi() {
  return !!process.env.OPENAI_API_KEY;
}

function getModel() {
  return getOpenAIModel();
}

function extractOutputText(response) {
  const output = Array.isArray(response?.output) ? response.output : [];
  const parts = [];
  for (const item of output) {
    if (item?.type === "output_text" && typeof item.text === "string") parts.push(item.text);
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const c of item.content) {
        if (c?.type === "output_text" && typeof c.text === "string") parts.push(c.text);
      }
    }
  }
  return parts.join("\n").trim();
}

async function openaiCreateResponse({ input, instructions }) {
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: getModel(), input, instructions }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }

  return await res.json();
}

const LANGUAGE_NAMES = {
  en: "English",
  ru: "Russian",
  ko: "Korean",
  kk: "Kazakh",
  uz: "Uzbek",
};

function buildFallbackInsight(stats, language = "en") {
  const total = Number(stats.taskSummary?.total || 0);
  const done = Number(stats.taskSummary?.done || 0);
  const overdue = Number(stats.taskSummary?.overdue || 0);
  const dueSoon = Number(stats.taskSummary?.due_next_7_days || 0);
  const avgOpen = Number(stats.taskSummary?.avg_open_task_minutes || 0);
  const topCourse = stats.topCourses?.[0];

  if (language === "ru") {
    const bits = [];
    bits.push(`Вы выполнили ${done} из ${total} задач.`);
    if (overdue > 0) bits.push(`${overdue} задач просрочено, поэтому сначала стоит разобрать старую работу.`);
    if (dueSoon > 0) bits.push(`${dueSoon} открытых задач нужно выполнить в ближайшие 7 дней.`);
    if (avgOpen > 0) bits.push(`Средняя оценка открытой задачи около ${avgOpen} минут.`);
    if (topCourse?.open_tasks > 0) bits.push(`Самая большая нагрузка сейчас в курсе ${topCourse.name}: ${topCourse.open_tasks} открытых задач.`);
    return bits.join(" ");
  }

  const bits = [];
  bits.push(`You have completed ${done} of ${total} tasks so far.`);
  if (overdue > 0) bits.push(`${overdue} task${overdue === 1 ? "" : "s"} are overdue, so clearing old work should be the first priority.`);
  if (dueSoon > 0) bits.push(`${dueSoon} open task${dueSoon === 1 ? "" : "s"} are due in the next 7 days.`);
  if (avgOpen > 0) bits.push(`Your average remaining task estimate is about ${avgOpen} minutes.`);
  if (topCourse?.open_tasks > 0) bits.push(`${topCourse.name} has the heaviest current load with ${topCourse.open_tasks} open task${topCourse.open_tasks === 1 ? "" : "s"}.`);
  return bits.join(" ");
}

async function buildAiInsight(stats, language = "en") {
  if (!canUseAi()) return buildFallbackInsight(stats, language);
  const languageName = LANGUAGE_NAMES[language] || "English";

  const instructions = [
    "You are an academic productivity analyst.",
    "Write one short paragraph (max 90 words).",
    `Write the paragraph in ${languageName}.`,
    "Focus on useful insights, not generic motivation.",
    "Mention the most important trend, risk, and next best action.",
    "Do not use markdown bullets.",
  ].join("\n");

  const input = [
    {
      role: "user",
      content: JSON.stringify(stats),
    },
  ];

  try {
    const response = await openaiCreateResponse({ input, instructions });
    return extractOutputText(response) || buildFallbackInsight(stats, language);
  } catch {
    return buildFallbackInsight(stats, language);
  }
}

function buildDerivedStats(stats) {
  const total = Number(stats.taskSummary?.total || 0);
  const done = Number(stats.taskSummary?.done || 0);
  const overdue = Number(stats.taskSummary?.overdue || 0);
  const dueSoon = Number(stats.taskSummary?.due_next_7_days || 0);
  const taskMinutes7d = stats.calendarLoad.reduce((sum, day) => sum + Number(day.task_minutes || 0), 0);
  const activityMinutes7d = stats.calendarLoad.reduce((sum, day) => sum + Number(day.activity_minutes || 0), 0);

  return {
    completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    overdueRate: total > 0 ? Math.round((overdue / total) * 100) : 0,
    next7DayLoadMinutes: dueSoon * Number(stats.taskSummary?.avg_open_task_minutes || 0),
    scheduledTaskMinutesLast7Days: taskMinutes7d,
    scheduledActivityMinutesLast7Days: activityMinutes7d,
  };
}

function getInsightCacheKey(userId, stats, language) {
  const snapshot = {
    language,
    taskSummary: stats.taskSummary,
    completionTrend: stats.completionTrend,
    calendarLoad: stats.calendarLoad,
    topCourses: stats.topCourses,
    derived: stats.derived,
  };
  return `${userId}:${JSON.stringify(snapshot)}`;
}

export async function getStatsForUser(userId) {
  const user = await findUserById(userId);
  const language = user?.language || "en";
  const stats = await getProductivityStats(userId);
  const derived = buildDerivedStats(stats);
  const quickInsight = buildFallbackInsight({ ...stats, derived }, language);

  return { ...stats, derived, quickInsight, aiInsightAvailable: canUseAi() };
}

export async function generateStatsInsightForUser(userId) {
  const user = await findUserById(userId);
  const language = user?.language || "en";
  const baseStats = await getProductivityStats(userId);
  const stats = { ...baseStats, derived: buildDerivedStats(baseStats) };
  const cacheKey = getInsightCacheKey(userId, stats, language);
  const cached = insightCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { insight: cached.insight, source: cached.source, cached: true };
  }

  const source = canUseAi() ? "openai" : "fallback";
  const insight = await buildAiInsight(stats, language);
  insightCache.set(cacheKey, {
    insight,
    source,
    expiresAt: Date.now() + INSIGHT_CACHE_TTL_MS,
  });

  return { insight, source, cached: false };
}
