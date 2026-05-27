import React from 'react';
import { groupByOTI, groupByAssignee, sumHours } from '../utils';

function AnimatedNumber({ target, suffix = "" }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const isFloat = !Number.isInteger(target);
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / 40, 3);
      const val   = eased * target;
      setDisplay(isFloat ? Math.round(val * 10) / 10 : Math.round(val));
      if (step >= 40) clearInterval(timer);
    }, 800 / 40);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{display}{suffix}</span>;
}

function StatTile({ value, suffix = "", label, sublabel, accent }) {
  return (
    <div className="card stat-tile">
      <div className="stat-tile-value" style={{ color: accent || "var(--text)" }}>
        <AnimatedNumber target={value} suffix={suffix} />
      </div>
      <div className="stat-tile-label">{label}</div>
      {sublabel && <div className="stat-tile-sub">{sublabel}</div>}
    </div>
  );
}

function FlipCard({ label, value, accent, items, renderItem }) {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className={"flip-card" + (flipped ? " flipped" : "")} onClick={() => setFlipped(f => !f)}>
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text3)" }}>{label}</div>
          <div style={{ fontSize:32, fontWeight:700, color: accent || "var(--text)", letterSpacing:"-0.02em" }}>{value}</div>
          <div style={{ fontSize:11, color:"var(--text3)" }}>Click to see list</div>
        </div>
        <div className="flip-card-back">
          <div className="flip-card-back-header">{label}</div>
          <div className="flip-card-back-list">
            {items.length === 0
              ? <div style={{ fontSize:12, color:"var(--text3)", marginTop:4 }}>None</div>
              : items.map((item, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom: i < items.length-1 ? "1px solid var(--border)" : "none" }}>
                    {renderItem(item)}
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ logs }) {
  const grouped    = React.useMemo(() => groupByOTI(logs), [logs]);
  const byAssignee = React.useMemo(() => groupByAssignee(logs), [logs]);

  const totalHours  = sumHours(logs);
  const totalOTIs   = Object.keys(grouped).length;
  const totalDays   = new Set(logs.map(l => l.date)).size;
  const avgPerDay   = totalDays > 0 ? Math.round((totalHours / totalDays) * 10) / 10 : 0;
  const teamMembers = Object.keys(byAssignee).length;

  const thisWeekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    return d.toISOString().slice(0, 10);
  })();
  const activeThisWeek = new Set(logs.filter(l => l.date >= thisWeekStart).map(l => l.assignee)).size;

  const allEntries = Object.entries(grouped);
  const inProgress = allEntries.filter(([,e]) => e.some(l => l.status === "In Progress"));
  const completed  = allEntries.filter(([,e]) => e[e.length-1]?.status === "Completed");
  const blocked    = allEntries.filter(([,e]) => e.some(l => l.status === "Blocked"));
  const activeOTIs = allEntries.filter(([,e]) => e.some(l => l.status === "In Progress" || l.status === "Blocked")).length;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px,1fr))", gap:12, marginBottom:16 }}>
        <StatTile value={totalHours} suffix="h" label="Total hours"   sublabel={`across ${totalDays} days`}        accent="var(--indigo)" />
        <StatTile value={totalOTIs}             label="Total OTIs"    sublabel={`${activeOTIs} currently active`} />
        <StatTile value={teamMembers}           label="Team members"  sublabel={`${activeThisWeek} logged this week`} accent="var(--green)" />
        <StatTile value={avgPerDay}  suffix="h" label="Avg per day"   sublabel="across all assignees"              accent="var(--amber)" />
      </div>

      <div className="card">
        <div className="card-label">Status breakdown</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px,1fr))", gap:12 }}>
          <FlipCard label="In Progress" value={inProgress.length} accent="var(--amber)" items={inProgress}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
          <FlipCard label="Completed" value={completed.length} accent="var(--green)" items={completed}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
          <FlipCard label="Blocked" value={blocked.length} accent="var(--red)" items={blocked}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
          <FlipCard label="Team overview" value={teamMembers} accent="var(--indigo)" items={Object.entries(byAssignee)}
            renderItem={([assignee, entries]) => {
              const otiCount = new Set(entries.map(e => e.otiId)).size;
              return (
                <>
                  <span style={{ fontSize:12, fontWeight:600, color:"var(--text)" }}>{assignee}</span>
                  <span style={{ fontSize:11, color:"var(--text2)" }}>{otiCount} OTI{otiCount !== 1 ? "s" : ""}</span>
                </>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
