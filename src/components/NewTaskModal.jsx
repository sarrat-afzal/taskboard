import { useState } from "react";
import Modal from "./Modal.jsx";
import TaskFields from "./TaskFields.jsx";
import { STATUS_LABEL } from "../lib/constants.js";

export default function NewTaskModal({ status, onClose, onCreate }) {
  const [value, setValue] = useState({
    title: "",
    description: "",
    priority: "normal",
    due_date: "",
    labels: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!value.title.trim()) return setError("Give the task a title.");
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title: value.title.trim(),
        description: value.description.trim() || null,
        priority: value.priority,
        due_date: value.due_date || null,
        labels: value.labels,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="sheet-head">
          <h3>New task</h3>
          <span className="sheet-sub">in {STATUS_LABEL[status]}</span>
        </div>
        <TaskFields value={value} onChange={setValue} />
        {error && <p className="form-error">{error}</p>}
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Adding…" : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
