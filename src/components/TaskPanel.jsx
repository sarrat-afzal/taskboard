import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import TaskFields from "./TaskFields.jsx";
import { STATUS_LABEL } from "../lib/constants.js";
import { fetchTaskDetail, addComment } from "../lib/useBoard.js";
import { timeAgo } from "../lib/dates.js";

function describe(a) {
  if (a.action === "created") return `Created in ${STATUS_LABEL[a.to_status] || "board"}`;
  if (a.action === "moved") return `Moved from ${STATUS_LABEL[a.from_status]} → ${STATUS_LABEL[a.to_status]}`;
  return "Edited details";
}

export default function TaskPanel({ task, onClose, onSave, onDelete }) {
  const [value, setValue] = useState(() => ({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    due_date: task.due_date || "",
    labels: task.labels || [],
    status: task.status,
  }));
  const [detail, setDetail] = useState({ comments: [], activity: [] });
  const [detailState, setDetailState] = useState("loading");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reload comments and history whenever the task changes (for example after a drag).
  useEffect(() => {
    let alive = true;
    fetchTaskDetail(task.id)
      .then((d) => alive && (setDetail(d), setDetailState("ready")))
      .catch(() => alive && setDetailState("error"));
    return () => {
      alive = false;
    };
  }, [task.id, task.updated_at]);

  const dirty =
    value.title !== task.title ||
    value.description !== (task.description || "") ||
    value.priority !== task.priority ||
    value.due_date !== (task.due_date || "") ||
    value.status !== task.status ||
    value.labels.join("|") !== (task.labels || []).join("|");

  async function save() {
    if (!value.title.trim()) return setError("Title can't be empty.");
    setBusy(true);
    setError(null);
    try {
      await onSave(task.id, {
        title: value.title.trim(),
        description: value.description.trim() || null,
        priority: value.priority,
        due_date: value.due_date || null,
        labels: value.labels,
        status: value.status,
      });
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function postComment(e) {
    e.preventDefault();
    const body = comment.trim();
    if (!body) return;
    try {
      const c = await addComment(task.id, body);
      setDetail((d) => ({ ...d, comments: [...d.comments, c] }));
      setComment("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal title={task.title} onClose={onClose} variant="panel">
      <div className="sheet-head">
        <h3>Task details</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <TaskFields value={value} onChange={setValue} showStatus />
      {error && <p className="form-error">{error}</p>}

      <div className="sheet-actions split">
        {confirmDelete ? (
          <span className="confirm">
            Delete this task?
            <button className="btn danger" onClick={() => onDelete(task.id)}>
              Delete
            </button>
            <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </span>
        ) : (
          <button className="btn ghost danger-text" onClick={() => setConfirmDelete(true)}>
            Delete task
          </button>
        )}
        <button className="btn primary" disabled={!dirty || busy} onClick={save}>
          {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </button>
      </div>

      <section className="panel-section">
        <h4>Comments</h4>
        {detailState === "loading" && <p className="muted">Loading…</p>}
        {detailState === "error" && <p className="form-error">Couldn't load comments.</p>}
        {detailState === "ready" && detail.comments.length === 0 && (
          <p className="muted">No comments yet. Leave a note for later.</p>
        )}
        <ul className="comments">
          {detail.comments.map((c) => (
            <li key={c.id}>
              <p>{c.body}</p>
              <time dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
            </li>
          ))}
        </ul>
        <form className="comment-form" onSubmit={postComment}>
          <input
            id="comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            placeholder="Write a comment"
          />
          <button className="btn" disabled={!comment.trim()}>
            Post
          </button>
        </form>
      </section>

      <section className="panel-section">
        <h4>Activity</h4>
        {detailState === "ready" && detail.activity.length === 0 && <p className="muted">No activity yet.</p>}
        <ol className="timeline">
          {detail.activity.map((a) => (
            <li key={a.id} className={`act-${a.action}`}>
              <span>{describe(a)}</span>
              <time dateTime={a.created_at}>{timeAgo(a.created_at)}</time>
            </li>
          ))}
        </ol>
      </section>
    </Modal>
  );
}
