import React from 'react';
import { CHART_COLORS, STATUS_OPTIONS, PRIORITY_OPTIONS, MONTHS, EMPTY_FORM, TEMPLATE_HEADERS } from '../constants';
import { calcHours, sumHours, groupByOTI, groupByAssignee, groupByWeek, getWeekLabel, statusStyle, priorityStyle, isCritical, applyFilters, loadFromStorage, saveToStorage, exportToCSV, parseCSV, parseExcelJSON, downloadTemplate } from '../utils';

function WeeklyView({ logs }) {
  const allByWeek   = React.useMemo(() => groupByWeek(logs), [logs]);
  const allWeeks    = Object.keys(allByWeek).sort().reverse();
  const availMonths = React.useMemo(() => {
    const set = new Set(allWeeks.map(w => w.slice(0,7)));
    return [...set].sort().reverse();
  }, [allWeeks]);
  const [selMonth, setSelMonth] = React.useState("");
  const weeks = selMonth ? allWeeks.filter(w => w.startsWith(selMonth)) : allWeeks;
  function monthLabel(ym) {
    const [y, m] = ym.split("-");
    return MONTHS[parseInt(m)-1] + " " + y;
  }
  if (allWeeks.length === 0) return (
    <div className="card empty"><div className="empty-icon">📅</div><div className="empty-text">No logs to display</div></div>
  );
  return (
    <div>
      <div className="card" style={{ padding:"1rem 1.5rem", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <label className="form-label" style={{ marginBottom:0, whiteSpace:"nowrap" }}>Filter by month</label>
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ maxWidth:200 }}>
            <option value="">All months</option>
            {availMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          {selMonth && <button className="btn-ghost" style={{ fontSize:12 }} onClick={() => setSelMonth("")}>Clear</button>}
        </div>
      </div>
      {weeks.length === 0 && (
        <div className="card empty"><div className="empty-icon">📅</div><div className="empty-text">No entries for this month</div></div>
      )}
      {weeks.map(week => {
        const entries  = allByWeek[week];
        const byOTI    = groupByOTI(entries);
        const otiCount = Object.keys(byOTI).length;
        return (
          <div key={week} className="card">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{getWeekLabel(week)}</div>
                <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>{entries.length} log entries · {otiCount} OTIs active</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>{["OTI ID","Title","Assignee","Days worked"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {Object.entries(byOTI).map(([otiId, otiEntries]) => {
                  const days     = new Set(otiEntries.map(e => e.date)).size;
                  const assignee = otiEntries[0].assignee;
                  const title    = otiEntries[0].title;
                  return (
                    <tr key={otiId}>
                      <td style={{ color:"var(--indigo)", fontWeight:600, whiteSpace:"nowrap" }}>{otiId}</td>
                      <td style={{ maxWidth:320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</td>
                      <td>{assignee}</td>
                      <td style={{ color:"var(--text)", fontWeight:500 }}>{days} {days === 1 ? "day" : "days"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default WeeklyView;
