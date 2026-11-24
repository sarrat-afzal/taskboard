import { useCallback, useMemo, useState } from "react";
import { useBoard } from "./lib/useBoard.js";
import Board from "./components/Board.jsx";
import Toolbar from "./components/Toolbar.jsx";
import NewTaskModal from "./components/NewTaskModal.jsx";
import TaskPanel from "./components/TaskPanel.jsx";
import { COLUMNS, PRIORITY_RANK, STATUS_LABEL } from "./lib/constants.js";
import { isOverdue, daysUntil } from "./lib/dates.js";

export default function App() {
  const { user, tasks, phase, error, reload, createTask, updateTask, deleteTask } = useBoard();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [label, setLabel] = useState("all");
  const [creatingIn, setCreatingIn] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, tone = "info") => {
    setToast({ message, tone, key: Date.now() });
    setTimeout(() => setToast((t) => (t && t.message === message ? null : t)), 3500);
  }, []);

  const labels = useMemo(() => [...new Set(tasks.flatMap((t) => t.labels || []))].sort(), [tasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks]
  );

  const filtering = query.trim() !== "" || priority !== "all" || label !== "all";

  // Within a column: overdue and high-priority work rises to the top.
  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
      .filter((t) => priority === "all" || t.priority === priority)
      .filter((t) => label === "all" || (t.labels || []).includes(label))
      .sort((a, b) => {
        const pa = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (pa) return pa;
        const da = daysUntil(a.due_date) ?? Infinity;
        const db = daysUntil(b.due_date) ?? Infinity;
        if (da !== db) return da - db;
        return new Date(a.created_at) - new Date(b.created_at);
      });
  }, [tasks, query, priority, label]);

  async function handleMove(task, status) {
    try {
      await updateTask(task.id, { status });
      if (status === "done") notify(`Nice. "${task.title}" is done.`, "success");
    } catch (e) {
      notify(`Couldn't move the task: ${e.message}`, "error");
    }
  }

  async function handleDelete(id) {
    setOpenId(null);
    try {
      await deleteTask(id);
      notify("Task deleted.");
    } catch (e) {
      notify(`Couldn't delete the task: ${e.message}`, "error");
    }
  }

  async function handleSave(id, changes) {
    await updateTask(id, changes);
    notify("Changes saved.", "success");
  }

  const openTask = tasks.find((t) => t.id === openId);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>Taskboard</span>
        </div>
        {user && (
          <span className="guest" title={`Guest ID ${user.id}`}>
            <span className="guest-dot" aria-hidden="true" />
            Guest session
          </span>
        )}
      </header>

      {phase === "loading" && <BoardSkeleton />}

      {phase === "error" && (
        <div className="state-card" role="alert">
          <h2>We couldn't load your board</h2>
          <p>{error}</p>
          {!error?.startsWith("Missing") && (
            <button className="btn primary" onClick={reload}>
              Try again
            </button>
          )}
        </div>
      )}

      {phase === "ready" && (
        <main>
          <Toolbar
            stats={stats}
            query={query}
            setQuery={setQuery}
            priority={priority}
            setPriority={setPriority}
            label={label}
            setLabel={setLabel}
            labels={labels}
            onNew={() => setCreatingIn("todo")}
          />
          {tasks.length === 0 && (
            <div className="welcome">
              <strong>Your board is empty.</strong> Create a task, then drag it across columns as work moves
              forward. Everything is saved to your private guest session.
            </div>
          )}
          <Board
            tasks={tasks}
            visibleTasks={visibleTasks}
            filtering={filtering}
            onMove={handleMove}
            onOpen={setOpenId}
            onAdd={setCreatingIn}
          />
        </main>
      )}

      {creatingIn && (
        <NewTaskModal
          status={creatingIn}
          onClose={() => setCreatingIn(null)}
          onCreate={async (fields) => {
            await createTask(fields);
            notify(`Added to ${STATUS_LABEL[fields.status]}.`, "success");
          }}
        />
      )}

      {openTask && (
        <TaskPanel
          key={openTask.id}
          task={openTask}
          onClose={() => setOpenId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {toast && (
        <div key={toast.key} className={`toast toast-${toast.tone}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="board skeleton" aria-busy="true" aria-label="Loading your board">
      {COLUMNS.map((c) => (
        <section key={c.id} className={`column col-${c.id}`}>
          <header className="column-head">
            <span className="column-dot" />
            <h2>{c.title}</h2>
          </header>
          <div className="column-body">
            <div className="shimmer" />
            <div className="shimmer short" />
          </div>
        </section>
      ))}
    </div>
  );
}
