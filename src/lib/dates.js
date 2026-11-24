// Dates from Postgres `date` columns come back as "YYYY-MM-DD". Parse them as
// local dates so a task due "today" doesn't shift a day in US time zones.
export function parseDay(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(value) {
  const day = parseDay(value);
  if (!day) return null;
  return Math.round((day - startOfToday()) / 86400000);
}

// Returns { tone, text } for the due-date badge, or null if there's no date.
export function dueInfo(value, status) {
  const days = daysUntil(value);
  if (days === null) return null;
  const label = parseDay(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (status === "done") return { tone: "muted", text: label };
  if (days < 0) return { tone: "overdue", text: days === -1 ? "Overdue · yesterday" : `Overdue · ${label}` };
  if (days === 0) return { tone: "soon", text: "Due today" };
  if (days === 1) return { tone: "soon", text: "Due tomorrow" };
  if (days <= 3) return { tone: "soon", text: `Due ${label}` };
  return { tone: "later", text: label };
}

export function isOverdue(task) {
  if (!task.due_date || task.status === "done") return false;
  return daysUntil(task.due_date) < 0;
}

export function timeAgo(iso) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso)) / 1000));
  const steps = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) return `${Math.floor(value)} ${unit}${Math.floor(value) === 1 ? "" : "s"} ago`;
    value /= size;
  }
  return `${Math.floor(value)} years ago`;
}
