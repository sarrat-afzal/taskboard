import { useDraggable } from "@dnd-kit/core";
import { dueInfo } from "../lib/dates.js";

export function TaskCardBody({ task, dragging = false }) {
  const due = dueInfo(task.due_date, task.status);
  return (
    <div className={`card prio-${task.priority}${dragging ? " card-overlay" : ""}`}>
      <div className="card-top">
        <span className={`prio-pill prio-pill-${task.priority}`}>{task.priority}</span>
        {due && <span className={`due due-${due.tone}`}>{due.text}</span>}
      </div>
      <p className="card-title">{task.title}</p>
      {task.description && <p className="card-desc">{task.description}</p>}
      {task.labels?.length > 0 && (
        <div className="card-labels">
          {task.labels.map((l) => (
            <span key={l} className="label-chip">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`card-slot${isDragging ? " is-dragging" : ""}`}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        // Enter opens the task; Space is reserved for keyboard dragging.
        if (e.key === "Enter") onOpen(task.id);
        else listeners?.onKeyDown?.(e);
      }}
      aria-label={`${task.title}, ${task.priority} priority. Press Enter to open, Space to move.`}
    >
      <TaskCardBody task={task} />
    </div>
  );
}
