import React from 'react';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS } from '../constants';
import { statusStyle, priorityStyle } from '../utils';

function ChipGroup({ value, options, onChange, getActiveStyle }) {
  return (
    <div className="chip-group">
      <button className={"chip" + (value === "" ? " chip-active" : "")} onClick={() => onChange("")}>
        All
      </button>
      {options.map(opt => {
        const isActive = value === opt;
        const st = isActive && getActiveStyle ? getActiveStyle(opt) : null;
        return (
          <button
            key={opt}
            className={"chip" + (isActive ? " chip-active" : "")}
            style={st ? { background: st.background, borderColor: st.color, color: st.color } : {}}
            onClick={() => onChange(isActive ? "" : opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Filters({ filters, onChange, onClear, allLogs }) {
  const assignees   = [...new Set(allLogs.map(l => l.assignee))];
  const years       = [...new Set(allLogs.map(l => l.date.slice(0, 4)))].sort().reverse();
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

      {/* Search + dropdowns */}
      <div className="form-grid" style={{ marginBottom:16 }}>
        <div style={{ gridColumn:"span 2" }}>
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
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status + Priority chip rows */}
      <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
        <div>
          <label className="form-label" style={{ marginBottom:8 }}>Status</label>
          <ChipGroup
            value={filters.status}
            options={STATUS_OPTIONS}
            onChange={v => onChange("status", v)}
            getActiveStyle={statusStyle}
          />
        </div>
        <div>
          <label className="form-label" style={{ marginBottom:8 }}>Priority</label>
          <ChipGroup
            value={filters.priority}
            options={PRIORITY_OPTIONS}
            onChange={v => onChange("priority", v)}
            getActiveStyle={priorityStyle}
          />
        </div>
      </div>
    </div>
  );
}

export default Filters;
