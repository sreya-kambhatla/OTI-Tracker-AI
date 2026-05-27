import React from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS } from '../constants';

function Filters({ filters, onChange, onClear, allLogs }) {
  const assignees  = [...new Set(allLogs.map(l => l.assignee))].sort();
  const years      = [...new Set(allLogs.map(l => l.date.slice(0,4)))].sort().reverse();
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="card" style={{ marginBottom:12 }}>
      <div style={{ display:"flex", gap:10, marginBottom:12, alignItems:"center" }}>
        <input
          value={filters.search}
          onChange={e => onChange("search", e.target.value)}
          placeholder="Search by OTI ID, title or assignee..."
          style={{ flex:2, minWidth:0 }}
        />
        <select value={filters.assignee} onChange={e => onChange("assignee", e.target.value)} style={{ flex:1, minWidth:0 }}>
          <option value="">All assignees</option>
          {assignees.map(a => <option key={a}>{a}</option>)}
        </select>
        <select value={filters.year} onChange={e => onChange("year", e.target.value)} style={{ flex:"0 0 110px" }}>
          <option value="">All years</option>
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select value={filters.month} onChange={e => onChange("month", e.target.value)} style={{ flex:"0 0 130px" }}>
          <option value="">All months</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>
          ))}
        </select>
        {activeCount > 0 && (
          <button className="btn-ghost" style={{ fontSize:12, flexShrink:0, whiteSpace:"nowrap" }} onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
        {["", ...STATUS_OPTIONS].map(s => (
          <button
            key={s || "all-status"}
            className={`chip${filters.status === s ? " chip-active" : ""}`}
            onClick={() => onChange("status", filters.status === s ? "" : s)}
          >
            {s || "All"}
          </button>
        ))}
        <div style={{ width:1, height:16, background:"var(--border2)", margin:"0 6px", flexShrink:0 }} />
        {["", ...PRIORITY_OPTIONS].map(p => (
          <button
            key={p || "all-priority"}
            className={`chip${filters.priority === p ? " chip-active" : ""}`}
            onClick={() => onChange("priority", filters.priority === p ? "" : p)}
          >
            {p || "All"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Filters;
