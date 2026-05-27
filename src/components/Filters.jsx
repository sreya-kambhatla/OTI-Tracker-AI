import React from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS } from '../constants';

function Filters({ filters, onChange, onClear, allLogs }) {
  const assignees   = [...new Set(allLogs.map(l => l.assignee))].sort();
  const years       = [...new Set(allLogs.map(l => l.date.slice(0,4)))].sort().reverse();
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div className="card-label" style={{ marginBottom:0 }}>
          Filter & search
          {activeCount > 0 && (
            <span style={{ marginLeft:8, background:"var(--indigo-bg)", color:"var(--indigo)", borderRadius:10, padding:"2px 8px", fontSize:10 }}>
              {activeCount} active
            </span>
          )}
        </div>
        {activeCount > 0 && <button className="btn-danger" onClick={onClear}>Clear all</button>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr repeat(3, auto)", gap:12, marginBottom:16, alignItems:"end" }}>
        <div>
          <label className="form-label">Search</label>
          <input value={filters.search} onChange={e => onChange("search", e.target.value)} placeholder="Search by OTI ID, title or assignee..." />
        </div>
        <div>
          <label className="form-label">Assignee</label>
          <select value={filters.assignee} onChange={e => onChange("assignee", e.target.value)}>
            <option value="">All</option>
            {assignees.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Year</label>
          <select value={filters.year} onChange={e => onChange("year", e.target.value)}>
            <option value="">All</option>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Month</label>
          <select value={filters.month} onChange={e => onChange("month", e.target.value)}>
            <option value="">All</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <div>
          <label className="form-label" style={{ marginBottom:8 }}>Status</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["", ...STATUS_OPTIONS].map(s => (
              <button
                key={s || "all"}
                className={`chip${filters.status === s ? " chip-active" : ""}`}
                onClick={() => onChange("status", filters.status === s ? "" : s)}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="form-label" style={{ marginBottom:8 }}>Priority</label>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {["", ...PRIORITY_OPTIONS].map(p => (
              <button
                key={p || "all"}
                className={`chip${filters.priority === p ? " chip-active" : ""}`}
                onClick={() => onChange("priority", filters.priority === p ? "" : p)}
              >
                {p || "All"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Filters;
