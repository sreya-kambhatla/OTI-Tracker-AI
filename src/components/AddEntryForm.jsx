import React from 'react';
import { CHART_COLORS, STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS, EMPTY_FORM, TEMPLATE_HEADERS } from '../constants';
import { calcHours, sumHours, groupByOTI, groupByAssignee, groupByWeek, getWeekLabel, statusStyle, priorityStyle, isCritical, applyFilters, loadFromStorage, saveToStorage, exportToCSV, parseCSV, parseExcelJSON, downloadTemplate } from '../utils';

function AddEntryForm({ onAdd, allLogs }) {
  const [form,  setForm]  = React.useState(EMPTY_FORM);
  const [error, setError] = React.useState("");
  const [open,  setOpen]  = React.useState(false);

  const hours       = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : null;
  const knownOTIIds = [...new Set(allLogs.map(l => l.otiId))];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "otiId") {
        const match = allLogs.find(l => l.otiId === value);
        if (match) { updated.title = match.title; updated.lead = match.lead; updated.assignee = match.assignee; }
      }
      return updated;
    });
    setError("");
  }

  function handleSubmit() {
    const required = ["otiId","title","createdBy","assignee","date","startTime","endTime"];
    for (const f of required) {
      if (!form[f].trim()) { setError(`"${f}" is required.`); return; }
    }
    if (!hours || hours <= 0) { setError("End time must be after start time."); return; }
    onAdd({ ...form, id: `log-${Date.now()}`, hours });
    setForm(EMPTY_FORM);
    setError("");
    setOpen(false);
  }

  return (
    <div className="card">
      <div onClick={() => setOpen(o => !o)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }}>
        <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>+ Add new log entry</div>
        <div style={{ fontSize:18, color:"var(--text3)", transform: open?"rotate(180deg)":"none", transition:"transform 0.2s" }}>⌄</div>
      </div>
      {open && (
        <div style={{ marginTop:20 }}>
          <div className="form-grid">
            <div>
              <label className="form-label">OTI ID</label>
              <input name="otiId" value={form.otiId} onChange={handleChange} placeholder="OTI-27720" list="oti-list" />
              <datalist id="oti-list">{knownOTIIds.map(id => <option key={id} value={id} />)}</datalist>
            </div>
            {[
              { name:"title",    label:"Title",    placeholder:"Task name" },
              { name:"createdBy", label:"Created By", placeholder:"Name" },
              { name:"assignee", label:"Assignee", placeholder:"Name" },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="form-label">{label}</label>
                <input name={name} value={form[name]} onChange={handleChange} placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="form-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}>
                {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Start time</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">End time</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label">Hours (auto)</label>
              <div className="hours-box">{hours !== null ? (hours > 0 ? `${hours} hrs` : "Invalid") : "—"}</div>
            </div>
            <div style={{ gridColumn:"span 2" }}>
              <label className="form-label">Notes (optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Any blockers, progress notes..." />
            </div>
          </div>
          {error && <div style={{ fontSize:12, color:"var(--red)", marginTop:12 }}>{error}</div>}
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button className="btn"       onClick={handleSubmit}>Add entry</button>
            <button className="btn-ghost" onClick={() => { setForm(EMPTY_FORM); setError(""); }}>Reset</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddEntryForm;
