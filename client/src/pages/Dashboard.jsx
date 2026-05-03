import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { apiTaskSummary, apiListTasks } from "../api/tasks.api";
import { apiListCourses } from "../api/courses.api";
import { apiListCalendarEvents } from "../api/calendar.api";
import CalendarWidget, { calendarVisibleRange } from "../components/CalendarWidget";

function toYmd(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function startOfWeekMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function monthLabel(date) {
  return date.toLocaleString(undefined, { month: "long", year: "numeric" });
}

function eventDayKey(ev) {
  const s = String(ev.start || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s.slice(0, 10);
}

function eventTimeLabel(ev) {
  if (ev.allDay) return "All day";
  const s = String(ev.start || "");
  const e = String(ev.end || "");
  const sh = s.includes("T") ? s.slice(11, 16) : "";
  const eh = e.includes("T") ? e.slice(11, 16) : "";
  if (sh && eh) return `${sh}-${eh}`;
  if (sh) return sh;
  return "No time";
}

function eventTypeLabel(ev) {
  if (ev.type === "task") return "Task";
  if (ev.type === "course") return "Course";
  if (ev.type === "exam") return "Exam";
  if (ev.type === "block") {
    if (ev?.meta?.blockType === "activity") return "Activity";
    if (ev?.meta?.blockType === "task") return "Planned task";
    return "Block";
  }
  return "Event";
}

function StatCard({ label, value, hint, to = "/tasks" }) {
  const displayValue = value ?? "...";
  return (
    <Link className="card stat lift col-3 dashboard-stat-card" to={to}>
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        {hint ? (
          <div className="kpi">
            <span className="kpi-dot" />
            {hint}
          </div>
        ) : null}
      </div>
      <div className="stat-value">{displayValue}</div>
    </Link>
  );
}

function CourseList({ courses, feature = false }) {
  if (courses.length === 0) {
    return (
      <div className="empty dashboard-mini-empty">
        <div className="empty-title">No courses yet</div>
        <div className="empty-sub">Create a course to start organizing tasks and schedules.</div>
        <Link className="btn btn-primary" to="/courses">
          Create course
        </Link>
      </div>
    );
  }

  return (
    <div className={`list dashboard-course-list ${feature ? "dashboard-course-list-feature" : ""}`}>
      {courses.map((c) => (
        <Link key={c.id} to={`/courses/${c.id}`} className="dashboard-course-link">
          <div
            className="row-item lift dashboard-course-row"
            style={{ "--course-color": c.color || "rgba(124,124,255,.72)" }}
          >
            <div className="row-left" style={{ minWidth: 0 }}>
              <div className="row-title dashboard-course-title">
                <span className="course-dot" style={{ background: c.color || "rgba(124,124,255,.55)" }} />
                <span>{c.name}</span>
              </div>
              <div className="row-meta">
                {c.day_of_week ? `${c.day_of_week}` : "No day"}{" "}
                {c.start_time || c.end_time
                  ? `- ${fmtTime(c.start_time)}${c.start_time && c.end_time ? "-" : ""}${fmtTime(c.end_time)}`
                  : ""}
              </div>
            </div>
            <span className="muted small">-&gt;</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SchedulePane({ anchor, events, loading, onPrevMonth, onNextMonth }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const ev of events || []) {
      const key = eventDayKey(ev);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, list]) => ({
        day,
        events: list.sort((a, b) => String(a.start).localeCompare(String(b.start))),
      }));
  }, [events]);

  return (
    <section className="dashboard-board-page dashboard-schedule-pane" aria-label="Schedule" data-tour="dashboard-schedule">
      <div className="dashboard-pane-head">
        <div>
          <h2 className="section-title">Schedule</h2>
          <div className="section-sub">Courses, tasks, and planned blocks for {monthLabel(anchor)}</div>
        </div>
        <div className="row dashboard-schedule-controls">
          <button className="btn btn-ghost" onClick={onPrevMonth} type="button" aria-label="Previous month">
            ‹
          </button>
          <button className="btn btn-ghost" onClick={onNextMonth} type="button" aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="card lift dashboard-schedule-list-card">
        {loading ? (
          <div className="muted">Checking events...</div>
        ) : grouped.length === 0 ? (
          <div className="empty dashboard-schedule-empty">
            <div className="empty-title">No schedule items this month</div>
            <div className="empty-sub">Courses, due tasks, and planned blocks will appear here.</div>
          </div>
        ) : (
          <div className="dashboard-schedule-list">
            {grouped.map((group) => (
              <section key={group.day} className="dashboard-schedule-day">
                <div className="dashboard-schedule-date">
                  <span>{group.day}</span>
                  <span className="chip">{group.events.length}</span>
                </div>
                <div className="dashboard-schedule-events">
                  {group.events.map((ev) => (
                    <article
                      key={ev.id}
                      className={`dashboard-schedule-event cal-${ev.type}`}
                      style={{ borderLeftColor: ev?.meta?.color || undefined }}
                    >
                      <div className="dashboard-schedule-event-main">
                        <div className="row-title">{ev.title}</div>
                        <div className="row-meta">{eventTypeLabel(ev)}</div>
                      </div>
                      <div className="dashboard-schedule-time">{eventTimeLabel(ev)}</div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CalendarSchedulePane({ anchor, events, loading, onPrevMonth, onNextMonth }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const ev of events || []) {
      const s = String(ev.start || "");
      const key = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : s.slice(0, 10);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, list]) => ({
        day,
        events: list.sort((a, b) => String(a.start).localeCompare(String(b.start))),
      }));
  }, [events]);

  return (
    <section className="dashboard-board-page dashboard-schedule-pane" aria-label="Schedule" data-tour="dashboard-schedule">
      <div className="card lift dashboard-calendar-card">
        <CalendarWidget
          anchor={anchor}
          events={events}
          loading={loading}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          compact
        />
      </div>
      <div className="card lift dashboard-mobile-schedule-list-card is-mounted">
        <div className="dashboard-pane-head">
          <div>
            <h2 className="section-title">Schedule</h2>
            <div className="section-sub">Days and tasks</div>
          </div>
        </div>
        {loading ? (
          <div className="muted">Checking events...</div>
        ) : grouped.length === 0 ? (
          <div className="empty dashboard-schedule-empty">
            <div className="empty-title">No schedule items</div>
            <div className="empty-sub">Courses, due tasks, and planned blocks will appear here.</div>
          </div>
        ) : (
          <div className="dashboard-mobile-schedule-list">
            {grouped.map((group) => (
              <section key={group.day} className="dashboard-mobile-schedule-day">
                <div className="dashboard-mobile-schedule-date">
                  <span>{group.day}</span>
                  <span className="chip">{group.events.length}</span>
                </div>
                <div className="dashboard-mobile-schedule-events">
                  {group.events.map((ev) => (
                    <article key={ev.id} className={`dashboard-mobile-schedule-event cal-${ev.type}`}>
                      <div className="row-title">{ev.title}</div>
                      <div className="row-meta">
                        {ev.type || "event"} {String(ev.start || "").includes("T") ? `- ${String(ev.start).slice(11, 16)}` : ""}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [weekTasks, setWeekTasks] = useState([]);
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState("");
  const [error, setError] = useState("");
  const boardRef = useRef(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      const { gridStart, gridEnd } = calendarVisibleRange(new Date());
      const start = startOfWeekMonday(new Date());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const [summaryResult, coursesResult, calendarResult, tasksResult] = await Promise.allSettled([
        apiTaskSummary(),
        apiListCourses(),
        apiListCalendarEvents({ start: toYmd(gridStart), end: toYmd(gridEnd) }),
        apiListTasks({ from: toYmd(start), to: toYmd(end) }),
      ]);

      if (cancelled) return;

      if (summaryResult.status === "fulfilled") {
        const nextSummary = summaryResult.value.summary || {};
        setSummary({
          overdue: nextSummary.overdue ?? 0,
          due_today: nextSummary.due_today ?? 0,
          due_this_week: nextSummary.due_this_week ?? 0,
          open_total: nextSummary.open_total ?? 0,
        });
      } else {
        setSummary({ overdue: 0, due_today: 0, due_this_week: 0, open_total: 0 });
      }

      if (coursesResult.status === "fulfilled") setCourses(coursesResult.value.courses || []);
      if (calendarResult.status === "fulfilled") setCalendarEvents(calendarResult.value.events || []);
      setCalendarLoading(false);

      if (tasksResult.status === "fulfilled") {
        setWeekTasks((tasksResult.value.tasks || []).filter((x) => x.status !== "done"));
      }

      const failed = [summaryResult, coursesResult, calendarResult, tasksResult].find(
        (result) => result.status === "rejected",
      );
      if (failed) {
        setError(failed.reason?.response?.data?.error?.message || "Some dashboard data could not be loaded");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendar() {
      setCalendarLoading(true);
      try {
        const { gridStart, gridEnd } = calendarVisibleRange(calendarAnchor);
        const cal = await apiListCalendarEvents({ start: toYmd(gridStart), end: toYmd(gridEnd) });
        if (!cancelled) setCalendarEvents(cal.events || []);
      } catch (err) {
        // Non-fatal; the rest of the dashboard still works.
      } finally {
        if (!cancelled) setCalendarLoading(false);
      }
    }

    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [calendarAnchor]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;

    function onWheel(event) {
      if (!event.target?.closest?.(".dashboard-shell")) return;
      if (window.matchMedia("(max-width: 980px)").matches) return;
      const modeMultiplier = event.deltaMode === 1 ? 36 : event.deltaMode === 2 ? board.clientWidth : 1;
      const rawDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const delta = rawDelta * modeMultiplier;
      if (!delta) return;
      event.preventDefault();
      board.scrollBy({ left: delta, behavior: "auto" });
    }

    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => document.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  const topCourses = useMemo(() => courses.slice(0, 6), [courses]);

  function prevMonth() {
    const d = new Date(calendarAnchor);
    d.setMonth(d.getMonth() - 1);
    setCalendarAnchor(d);
  }

  function nextMonth() {
    const d = new Date(calendarAnchor);
    d.setMonth(d.getMonth() + 1);
    setCalendarAnchor(d);
  }

  function handleBoardMouseDown(event) {
    if (event.button !== 0 || !boardRef.current) return;
    event.preventDefault();
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: boardRef.current.scrollLeft,
    };
    boardRef.current.classList.add("is-dragging");
  }

  function handleBoardMouseMove(event) {
    const drag = dragRef.current;
    const board = boardRef.current;
    if (!drag.active || !board) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) drag.moved = true;
    board.scrollLeft = drag.scrollLeft - distance;
  }

  function stopBoardDrag() {
    dragRef.current.active = false;
    boardRef.current?.classList.remove("is-dragging");
  }

  function handleBoardClickCapture(event) {
    if (!dragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
  }

  return (
    <>
      <Navbar />
      <div className="container bg-texture reveal dashboard-shell">
        <div className="page-header dashboard-page-header" data-tour="dashboard-header">
          <div>
            <div className="title">Dashboard</div>
            <div className="muted small">
              Logged in as <b>{user?.email}</b>
            </div>
          </div>

          <div className="row">
            <Link className="btn btn-ghost" to="/week">
              Weekly
            </Link>
            <Link className="btn btn-primary" to="/tasks" data-tour="tasks-entry">
              Quick Add
            </Link>
          </div>
        </div>

        {error ? (
          <div className="card dashboard-error" style={{ borderColor: "rgba(255,77,79,.35)" }}>
            <div style={{ color: "var(--danger)" }}>{error}</div>
          </div>
        ) : null}

        <div
          ref={boardRef}
          className="dashboard-board"
          aria-label="Dashboard and schedule"
          onMouseDown={handleBoardMouseDown}
          onMouseMove={handleBoardMouseMove}
          onMouseUp={stopBoardDrag}
          onMouseLeave={stopBoardDrag}
          onClickCapture={handleBoardClickCapture}
          onDragStart={(event) => event.preventDefault()}
        >
          <section className="dashboard-board-page dashboard-home-pane" aria-label="Dashboard overview">
            <div className="dashboard-command-grid">
              <div className="grid-12 dashboard-stat-grid" data-tour="dashboard-stats">
                <StatCard label="Overdue" value={summary ? summary.overdue : "..."} hint="past due" />
                <StatCard label="Due today" value={summary ? summary.due_today : "..."} hint="today" />
                <StatCard label="Due this week" value={summary ? summary.due_this_week : "..."} hint="Mon-Sun" />
                <StatCard label="Open tasks" value={summary ? summary.open_total : "..."} hint="not done" />
              </div>

              <section className="dashboard-panel dashboard-courses-main" data-tour="dashboard-courses">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Your courses</h2>
                    <div className="section-sub">Classes and study blocks you use most</div>
                  </div>

                  <div className="chips">
                    <span className="chip">{topCourses.length} shown</span>
                    <Link className="chip dashboard-chip-link" to="/courses">Manage</Link>
                  </div>
                </div>

                <div className="dashboard-mobile-tools" data-tour="dashboard-mobile-tools">
                  <button type="button" className="btn btn-ghost" onClick={() => setMobilePanel("courses")}>
                    Courses
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setMobilePanel("actions")}>
                    Quick actions
                  </button>
                </div>

                <div className="card lift accent-edge dashboard-courses-feature-card">
                  <CourseList courses={topCourses} feature />
                </div>
              </section>

              <aside className="dashboard-side-stack">
                <div className="card lift dashboard-quick-actions" data-tour="dashboard-actions">
                  <div className="section-head dashboard-mini-head">
                    <h2 className="section-title">Quick actions</h2>
                    <div className="section-sub">Common stuff you'll do a lot</div>
                  </div>

                  <div className="dashboard-action-list">
                    <Link className="dashboard-action-row" to="/courses">
                      <span>
                        <span className="row-title">Create courses</span>
                        <span className="row-meta">Days, times, colors</span>
                      </span>
                      <span className="btn btn-primary">Open</span>
                    </Link>
                    <Link className="dashboard-action-row" to="/tasks">
                      <span>
                        <span className="row-title">Add tasks</span>
                        <span className="row-meta">Due dates and status</span>
                      </span>
                      <span className="btn btn-primary">Open</span>
                    </Link>
                    <Link className="dashboard-action-row" to="/week">
                      <span>
                        <span className="row-title">Weekly plan</span>
                        <span className="row-meta">Plan study blocks</span>
                      </span>
                      <span className="btn btn-primary">Open</span>
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <CalendarSchedulePane
            anchor={calendarAnchor}
            events={calendarEvents}
            loading={calendarLoading}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        </div>

        {mobilePanel ? (
          <div className="mobile-sheet-backdrop is-open" onClick={() => setMobilePanel("")}>
            <section className="mobile-sheet-card" onClick={(event) => event.stopPropagation()}>
              <div className="mobile-sheet-handle" aria-hidden="true" />
              <div className="mobile-sheet-head">
                <div>
                  <div className="mobile-sheet-title">
                    {mobilePanel === "courses" ? "Your courses" : "Quick actions"}
                  </div>
                  <div className="small muted">
                    {mobilePanel === "courses" ? "Course shortcuts for this workspace." : "Common dashboard actions."}
                  </div>
                </div>
                <button type="button" className="icon-btn" onClick={() => setMobilePanel("")} aria-label="Close">
                  X
                </button>
              </div>

              {mobilePanel === "courses" ? (
                <CourseList courses={topCourses} />
              ) : (
                <div className="mobile-sheet-actions">
                  <Link className="btn btn-primary" to="/courses">
                    Go to Courses
                  </Link>
                  <Link className="btn btn-primary" to="/tasks">
                    Go to Tasks
                  </Link>
                  <Link className="btn btn-primary" to="/week">
                    Open Weekly
                  </Link>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </>
  );
}
