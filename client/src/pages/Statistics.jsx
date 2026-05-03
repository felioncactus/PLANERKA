
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { apiGenerateStatsInsight, apiGetStats } from "../api/stats.api";
import { useLanguage } from "../context/LanguageContext";

function StatCard({ label, value, hint }) {
  return (
    <div className="card stat lift">
      <div className="stat-top">
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="kpi">
        <span className="kpi-dot" />
        <span>{hint}</span>
      </div>
    </div>
  );
}

function formatMinutes(value) {
  const minutes = Number(value || 0);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

function MiniBars({ rows, valueKey, emptyLabel }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  if (!rows.length) return <div className="small muted">{emptyLabel}</div>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div key={`${row.day || row.name}-${valueKey}`} style={{ display: "grid", gap: 6 }}>
          <div className="row" style={{ justifyContent: "space-between", gap: 12 }}>
            <span className="small">{row.day || row.name}</span>
            <span className="small muted">{valueKey.includes("minutes") ? formatMinutes(row[valueKey]) : row[valueKey]}</span>
          </div>
          <div className="progress">
            <div style={{ width: `${Math.max(6, (Number(row[valueKey] || 0) / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Statistics() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [aiInsightMeta, setAiInsightMeta] = useState(null);
  const [insightError, setInsightError] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiGetStats();
        if (!alive) return;
        setStats(data.stats || null);
        setAiInsight("");
        setAiInsightMeta(null);
        setInsightError("");
      } catch (err) {
        if (!alive) return;
        setError(err?.response?.data?.error?.message || "Failed to load statistics");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const courseRows = useMemo(
    () => (stats?.topCourses || []).map((course) => ({ ...course, name: `${course.name} (${course.open_tasks} ${t("open")})` })),
    [stats, t]
  );

  async function handleGenerateInsight() {
    setInsightLoading(true);
    setInsightError("");
    try {
      const data = await apiGenerateStatsInsight();
      setAiInsight(data.insight || "");
      setAiInsightMeta({ source: data.source, cached: data.cached });
    } catch (err) {
      setInsightError(err?.response?.data?.error?.message || "Failed to generate AI insight");
    } finally {
      setInsightLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="container stack" style={{ marginTop: 18 }}>
        <div className="page-header">
          <div>
            <div className="title">Statistics</div>
            <div className="small muted">
              Useful weekly insight from your tasks and calendar blocks.
            </div>
          </div>
        </div>

        {error ? <div className="notice notice-danger">{error}</div> : null}
        {loading ? <div className="card small muted">Loading statistics…</div> : null}

        {stats ? (
          <>
            <div className="grid-12">
              <div className="col-3"><StatCard label="Completion rate" value={`${stats.derived?.completionRate || 0}%`} hint="done / total tasks" /></div>
              <div className="col-3"><StatCard label="Overdue rate" value={`${stats.derived?.overdueRate || 0}%`} hint="needs cleanup" /></div>
              <div className="col-3"><StatCard label="Task time (7d)" value={formatMinutes(stats.derived?.scheduledTaskMinutesLast7Days)} hint="scheduled blocks" /></div>
              <div className="col-3"><StatCard label="Activity time (7d)" value={formatMinutes(stats.derived?.scheduledActivityMinutesLast7Days)} hint="fixed events" /></div>
            </div>

            <div className="grid-12">
              <div className="col-8 card lift accent-edge">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Insight</h2>
                    <div className="section-sub">What matters most right now</div>
                  </div>
                  <button className="btn btn-primary" onClick={handleGenerateInsight} disabled={insightLoading}>
                    {insightLoading ? "Generating..." : aiInsight ? "Refresh AI insight" : "Generate AI insight"}
                  </button>
                </div>
                <div className="notice" style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 650, marginBottom: 8 }}>
                    {aiInsight ? "AI insight" : "Quick insight"}
                  </div>
                  <div style={{ fontSize: 16, lineHeight: 1.7 }}>{aiInsight || stats.quickInsight}</div>
                  {aiInsightMeta?.cached ? <div className="small muted" style={{ marginTop: 8 }}>Loaded from recent cache.</div> : null}
                  {!stats.aiInsightAvailable ? (
                    <div className="small muted" style={{ marginTop: 8 }}>
                      OpenAI is not configured, so this uses the free quick insight.
                    </div>
                  ) : null}
                </div>
                {insightError ? <div className="notice notice-danger" style={{ marginTop: 10 }}>{insightError}</div> : null}
              </div>

              <div className="col-4 card lift">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Snapshot</h2>
                    <div className="section-sub">Current task pressure</div>
                  </div>
                </div>
                <div className="list" style={{ marginTop: 12 }}>
                  <div className="row-item"><span>Total tasks</span><strong>{stats.taskSummary?.total || 0}</strong></div>
                  <div className="row-item"><span>Done</span><strong>{stats.taskSummary?.done || 0}</strong></div>
                  <div className="row-item"><span>Overdue</span><strong>{stats.taskSummary?.overdue || 0}</strong></div>
                  <div className="row-item"><span>Due today</span><strong>{stats.taskSummary?.due_today || 0}</strong></div>
                  <div className="row-item"><span>Due next 7 days</span><strong>{stats.taskSummary?.due_next_7_days || 0}</strong></div>
                  <div className="row-item"><span>Avg open task</span><strong>{formatMinutes(stats.taskSummary?.avg_open_task_minutes)}</strong></div>
                </div>
              </div>
            </div>

            <div className="grid-12">
              <div className="col-6 card lift">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Daily completed trend</h2>
                    <div className="section-sub">Recent task movement</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <MiniBars rows={stats.completionTrend || []} valueKey="completed" emptyLabel="No recent completions yet." />
                </div>
              </div>

              <div className="col-6 card lift">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Scheduled study load</h2>
                    <div className="section-sub">Task block minutes over the last 7 days</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <MiniBars rows={stats.calendarLoad || []} valueKey="task_minutes" emptyLabel="No recent task blocks yet." />
                </div>
              </div>
            </div>

            <div className="grid-12">
              <div className="col-6 card lift">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Courses needing attention</h2>
                    <div className="section-sub">Sorted by open work</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <MiniBars rows={courseRows} valueKey="open_tasks" emptyLabel="No course-linked tasks yet." />
                </div>
              </div>

              <div className="col-6 card lift">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Activity load</h2>
                    <div className="section-sub">Fixed activity minutes over the last 7 days</div>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <MiniBars rows={stats.calendarLoad || []} valueKey="activity_minutes" emptyLabel="No recent activities yet." />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
