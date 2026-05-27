import React from 'react';
import { groupByOTI, groupByAssignee, statusStyle } from '../utils';
import { EmptyState, NoTeamIllustration } from './Icons';

function WorkloadView({ logs }) {
  const byAssignee = React.useMemo(() => groupByAssignee(logs), [logs]);
  const assignees  = Object.keys(byAssignee).sort();

  if (assignees.length === 0) return (
    <EmptyState
      illustration={<NoTeamIllustration />}
      title="No workload data"
      subtitle="Log some work hours to see team workload and assignee breakdowns here."
    />
  );

  return (
    <div>
      {assignees.map(assignee => {
        const entries  = byAssignee[assignee];
        const byOTI    = groupByOTI(entries);
        const otiCount = Object.keys(byOTI).length;
        const days     = new Set(entries.map(e => e.date)).size;
        return (
          <div key={assignee} className="card">
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{assignee}</div>
              <div style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
                {otiCount} OTI{otiCount !== 1 ? "s" : ""} · {days} days logged
              </div>
            </div>
            <table>
              <thead>
                <tr>{["OTI ID","Title","Status","Days worked","Last logged"].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {Object.entries(byOTI).map(([otiId, otiEntries]) => {
                  const otiDays = new Set(otiEntries.map(e => e.date)).size;
                  const latest  = otiEntries.slice().sort((a,b) => b.date.localeCompare(a.date))[0];
                  const title   = otiEntries[0].title;
                  return (
                    <tr key={otiId}>
                      <td style={{ color:"var(--indigo)", fontWeight:600, whiteSpace:"nowrap" }}>{otiId}</td>
                      <td style={{ maxWidth:320, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</td>
                      <td><span className="badge" style={statusStyle(latest.status)}>{latest.status}</span></td>
                      <td style={{ color:"var(--text)", fontWeight:500 }}>{otiDays} {otiDays === 1 ? "day" : "days"}</td>
                      <td style={{ color:"var(--text2)" }}>{latest.date}</td>
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

export default WorkloadView;
