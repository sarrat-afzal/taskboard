import { useState } from "react";
import { PRIORITIES, COLUMNS } from "../lib/constants.js";

// Shared form fields for creating and editing a task.
export default function TaskFields({ value, onChange, showStatus = false }) {
  const [labelDraft, setLabelDraft] = useState("");
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });

  function addLabel() {
    const l = labelDraft.trim().slice(0, 24);
    if (!l || value.labels.includes(l) || value.labels.length >= 6) return setLabelDraft("");
    onChange({ ...value, labels: [...value.labels, l] });
    setLabelDraft("");
  }

  return (
    <div className="fields">
      <label className="field">
        <span>Title</span>
        <input
          id="task-title"
          value={value.title}
          onChange={set("title")}
          maxLength={200}
          placeholder="What needs to happen?"
          required
        />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          id="task-description"
          value={value.description}
          onChange={set("description")}
          rows={3}
          maxLength={4000}
          placeholder="Add details, links or acceptance criteria"
        />
      </label>
      <div className="field-row">
        <fieldset className="field">
          <span>Priority</span>
          <div className="segmented" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p.id}
                role="radio"
                aria-checked={value.priority === p.id}
                className={`seg seg-${p.id}${value.priority === p.id ? " on" : ""}`}
                onClick={() => onChange({ ...value, priority: p.id })}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>Due date</span>
          <input id="task-due" type="date" value={value.due_date || ""} onChange={set("due_date")} />
        </label>
      </div>
      {showStatus && (
        <label className="field">
          <span>Status</span>
          <select id="task-status" value={value.status} onChange={set("status")}>
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="field">
        <span>Labels</span>
        <div className="label-editor">
          {value.labels.map((l) => (
            <span key={l} className="label-chip removable">
              {l}
              <button
                type="button"
                aria-label={`Remove label ${l}`}
                onClick={() => onChange({ ...value, labels: value.labels.filter((x) => x !== l) })}
              >
                ×
              </button>
            </span>
          ))}
          <input
            id="task-label"
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addLabel();
              }
            }}
            onBlur={addLabel}
            placeholder={value.labels.length ? "Add another" : "e.g. Bug, Feature, Design"}
          />
        </div>
      </div>
    </div>
  );
}
