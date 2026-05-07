export function startOfDay(dateLike) {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(dateLike) {
  const date = new Date(dateLike);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function clampTime(value, min, max) {
  return new Date(Math.min(Math.max(value, min), max));
}

export function formatTaskDueLabel(value) {
  if (!value) return "No due date";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function createTaskReminderTimeline(task) {
  if (!task?.due_date || task.status === "done") return [];
  const now = Date.now();
  const dueAt = endOfDay(task.due_date).getTime();
  if (Number.isNaN(dueAt)) return [];

  const createdAtRaw = task.created_at ? new Date(task.created_at).getTime() : NaN;
  const createdAt = Number.isNaN(createdAtRaw) ? startOfDay(task.due_date).getTime() - (7 * 24 * 60 * 60 * 1000) : createdAtRaw;
  const totalWindow = Math.max(dueAt - createdAt, 24 * 60 * 60 * 1000);

  const stageSpecs = [
    {
      key: "perfect",
      title: "It is the perfect time to start",
      body: "Starting now keeps this task comfortably on track.",
      time: clampTime(createdAt + totalWindow * 0.18, createdAt + 60 * 60 * 1000, dueAt - 36 * 60 * 60 * 1000).getTime(),
      tone: "accent",
    },
    {
      key: "buffer",
      title: "You still have a little time",
      body: "There is still room to begin without rushing, but the buffer is shrinking.",
      time: clampTime(createdAt + totalWindow * 0.55, createdAt + 4 * 60 * 60 * 1000, dueAt - 18 * 60 * 60 * 1000).getTime(),
      tone: "warning",
    },
    {
      key: "urgent",
      title: "It is almost too late",
      body: "This task is getting close to the deadline. Starting now matters.",
      time: clampTime(dueAt - 8 * 60 * 60 * 1000, createdAt + 8 * 60 * 60 * 1000, dueAt - 30 * 60 * 1000).getTime(),
      tone: "danger",
    },
    {
      key: "late",
      title: "You forgot to do this task",
      body: "The deadline has passed. Re-open it now and decide the next step.",
      time: dueAt + 60 * 60 * 1000,
      tone: "danger",
    },
  ];

  return stageSpecs
    .filter((stage, index, stages) => stage.time <= now && stage.time >= createdAt && (index === 0 || stage.time > stages[index - 1].time))
    .map((stage, index) => ({
      id: `task-reminder-${task.id}-${stage.key}`,
      chat_id: "task-reminders",
      sender_id: null,
      sender_kind: "bot",
      sender_name: "Task reminder bot",
      body: `${stage.title}\n${task.title}`,
      created_at: new Date(stage.time).toISOString(),
      attachments: [],
      metadata: {
        kind: "task_reminder",
        reminder: {
          task_id: task.id,
          task_title: task.title,
          due_date: task.due_date,
          status: task.status,
          stage_key: stage.key,
          stage_title: stage.title,
          stage_body: stage.body,
          tone: stage.tone,
          can_start: task.status !== "doing" && task.status !== "done",
        },
      },
      order: stage.time + index,
    }));
}

export function createReminderBotChat(tasks = []) {
  const reminderMessages = tasks
    .flatMap((task) => createTaskReminderTimeline(task))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const lastMessage = reminderMessages[reminderMessages.length - 1] || null;
  const openTasks = tasks.filter((task) => task.status !== "done" && task.due_date).length;

  return {
    id: "task-reminders",
    type: "bot",
    title: "Task reminder bot",
    created_by: null,
    participants: [],
    updated_at: lastMessage?.created_at || new Date().toISOString(),
    unread_count: 0,
    last_message_preview: lastMessage?.metadata?.reminder?.stage_title || (openTasks ? `${openTasks} active task reminder${openTasks === 1 ? "" : "s"}` : "No pending reminders"),
    reminderMessages,
    reminderTaskCount: openTasks,
  };
}
