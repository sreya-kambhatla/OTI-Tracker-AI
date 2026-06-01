import React from 'react';
import { CHART_COLORS, STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS, EMPTY_FORM, TEMPLATE_HEADERS } from '../constants';
import { calcHours, sumHours, groupByOTI, groupByAssignee, groupByWeek, getWeekLabel, statusStyle, priorityStyle, isCritical, applyFilters, loadFromStorage, saveToStorage, exportToCSV, parseCSV, parseExcelJSON, downloadTemplate, formatDisplayDate } from '../utils';

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" style={{ padding: "8px 20px", fontSize: 13 }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function OTICard({ otiId, entries, onDelete, onEdit, onStatusChange }) {
  const [expanded, setExpanded] = React.useState(false);
  const [editId,   setEditId]   = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [confirm,  setConfirm]  = React.useState(null);

  const total   = sumHours(entries);
  const days    = entries.length;
  const avg     = (total / days).toFixed(1);
  const latest  = entries.slice().sort((a,b) => b.date.localeCompare(a.date))[0];

  function startEdit(log) {
    setEditId(log.id);
    setEditForm({ ...log });
  }

  function saveEdit() {
    const h = calcHours(editForm.startTime, editForm.endTime);
    onEdit({ ...editForm, hours: h > 0 ? h : editForm.hours });
    setEditId(null);
  }

  return (
    <div className="card">
      {confirm && (
        <ConfirmModal
          title="Delete log entry"
          message={`Delete the log entry for ${formatDisplayDate(confirm.date)}? This cannot be undone.`}
          onConfirm={() => { onDelete(confirm.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--indigo)", background:"var(--indigo-bg)", padding:"3px 9px", borderRadius:20 }}>{otiId}</span>
            <span className="badge" style={statusStyle(latest.status)}>{latest.status}</span>
            <span className={"badge" + (isCritical(latest.priority) ? " badge-critical" : "")} style={priorityStyle(latest.priority)}>{latest.priority}</span>
            <div style={{ display:"flex", gap:6, marginLeft:4 }}>
              {STATUS_OPTIONS.filter(s => s !== latest.status).map(s => (
                <button key={s} className="btn-ghost" style={{ fontSize:11, padding:"2px 10px" }} onClick={() => onStatusChange(otiId, s)}>
                  → {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--text)", marginBottom:12 }}>{entries[0].title}</div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[
              { label:"Total hours", value:`${total}h` },
              { label:"Days logged", value:days },
              { label:"Avg / day",   value:`${avg}h` },
              { label:"Created By",  value:latest.createdBy },
              { label:"Assignee",    value:latest.assignee },
              { label:"Last logged", value:formatDisplayDate(latest.date) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize:10, color:"var(--text3)", marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:500, color:"var(--text2)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-ghost" style={{ fontSize:12, whiteSpace:"nowrap", flexShrink:0 }} onClick={() => setExpanded(e => !e)}>
          {expanded ? "Hide ⌃" : "View logs ⌄"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop:16, borderTop:"1px solid var(--border)", paddingTop:16 }}>
          <table>
            <thead>
              <tr>{["Date","Created By","Assignee","Start","End","Hours","Status","Priority","Notes","",""].map((h,i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {entries.slice().sort((a,b) => a.date.localeCompare(b.date)).map(log => (
                editId === log.id ? (
                  <tr key={log.id} style={{ background:"var(--surface2)" }}>
                    <td><input className="edit-input" type="date" value={editForm.date} onChange={e => setEditForm(p => ({...p, date:e.target.value}))} /></td>
                    <td><input className="edit-input" value={editForm.createdBy||""} onChange={e => setEditForm(p => ({...p, createdBy:e.target.value}))} /></td>
                    <td><input className="edit-input" value={editForm.assignee} onChange={e => setEditForm(p => ({...p, assignee:e.target.value}))} /></td>
                    <td><input className="edit-input" type="time" value={editForm.startTime} onChange={e => setEditForm(p => ({...p, startTime:e.target.value}))} /></td>
                    <td><input className="edit-input" type="time" value={editForm.endTime} onChange={e => setEditForm(p => ({...p, endTime:e.target.value}))} /></td>
                    <td style={{ color:"var(--text)", fontWeight:600 }}>{calcHours(editForm.startTime, editForm.endTime) > 0 ? calcHours(editForm.startTime, editForm.endTime) + "h" : editForm.hours + "h"}</td>
                    <td>
                      <select className="edit-input" value={editForm.status} onChange={e => setEditForm(p => ({...p, status:e.target.value}))}>
                        {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="edit-input" value={editForm.priority} onChange={e => setEditForm(p => ({...p, priority:e.target.value}))}>
                        {PRIORITY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td><input className="edit-input" value={editForm.notes||""} onChange={e => setEditForm(p => ({...p, notes:e.target.value}))} placeholder="Notes..." /></td>
                    <td><button className="btn" style={{ fontSize:11, padding:"4px 10px" }} onClick={saveEdit}>Save</button></td>
                    <td><button className="btn-ghost" style={{ fontSize:11, padding:"4px 10px" }} onClick={() => setEditId(null)}>Cancel</button></td>
                  </tr>
                ) : (
                  <tr key={log.id}>
                    <td>{formatDisplayDate(log.date)}</td>
                    <td>{log.createdBy}</td>
                    <td>{log.assignee}</td>
                    <td>{log.startTime}</td>
                    <td>{log.endTime}</td>
                    <td style={{ color:"var(--text)", fontWeight:600 }}>{log.hours}h</td>
                    <td><span className="badge" style={statusStyle(log.status)}>{log.status}</span></td>
                    <td><span className={"badge" + (isCritical(log.priority) ? " badge-critical" : "")} style={priorityStyle(log.priority)}>{log.priority}</span></td>
                    <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.notes || <span style={{ color:"var(--text3)" }}>—</span>}</td>
                    <td><button className="btn-edit" onClick={() => startEdit(log)} title="Edit">✎</button></td>
                    <td><button className="btn-delete" onClick={() => setConfirm(log)} title="Delete">×</button></td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OTICard;
