export const COLUMNS = [
  { id: "todo", title: "To Do", hint: "Nothing here yet. Add a task to get started." },
  { id: "in_progress", title: "In Progress", hint: "Drag a task here when you start on it." },
  { id: "in_review", title: "In Review", hint: "Tasks waiting on a second look land here." },
  { id: "done", title: "Done", hint: "Finished work shows up here." },
];

export const STATUS_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.id, c.title]));

export const PRIORITIES = [
  { id: "high", label: "High" },
  { id: "normal", label: "Normal" },
  { id: "low", label: "Low" },
];

export const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };
