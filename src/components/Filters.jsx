import React from 'react';
import { CHART_COLORS, STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS, EMPTY_FORM, TEMPLATE_HEADERS } from '../constants';

function Filters({ filters, onChange, onClear, allLogs }) {
  const assignees   = [...new Set(allLogs.map(l => l.assignee))];
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
      <div className="form-grid">
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
          <label className="form-label">Status</label>
          <select value={filters.status} onChange={e => onChange("status", e.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select value={filters.priority} onChange={e => onChange("priority", e.target.value)}>
            <option value="">All</option>
            {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
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
    </div>
  );
}

export default Filters;
