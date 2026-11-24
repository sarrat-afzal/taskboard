import { PRIORITIES } from "../lib/constants.js";

export default function Toolbar({ stats, query, setQuery, priority, setPriority, label, setLabel, labels, onNew }) {
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
  return (
    <div className="toolbar">
      <div className="stats" aria-label="Board summary">
        <div className="stat">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-label">Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-num">{stats.done}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className={`stat${stats.overdue ? " stat-alert" : ""}`}>
          <span className="stat-num">{stats.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
        <div className="progress" aria-label={`${pct}% complete`}>
          <div className="progress-bar" style={{ width: `${pct}%` }} />
          <span>{pct}% complete</span>
        </div>
      </div>
      <div className="filters">
        <input
          id="search"
          className="search"
          type="search"
          placeholder="Search tasks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select id="filter-priority" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Filter by priority">
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <select id="filter-label" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Filter by label">
          <option value="all">All labels</option>
          {labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={onNew}>
          + New task
        </button>
      </div>
    </div>
  );
}
