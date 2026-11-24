import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard.jsx";

export default function Column({ column, tasks, totalInColumn, filtering, onOpen, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className={`column col-${column.id}${isOver ? " is-over" : ""}`} aria-label={column.title}>
      <header className="column-head">
        <span className="column-dot" aria-hidden="true" />
        <h2>{column.title}</h2>
        <span className="column-count">{tasks.length}</span>
        <button className="icon-btn" onClick={() => onAdd(column.id)} aria-label={`Add task to ${column.title}`}>
          +
        </button>
      </header>
      <div ref={setNodeRef} className="column-body">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && (
          <div className="column-empty">
            {filtering && totalInColumn > 0 ? "No tasks match your filters." : column.hint}
          </div>
        )}
      </div>
    </section>
  );
}
