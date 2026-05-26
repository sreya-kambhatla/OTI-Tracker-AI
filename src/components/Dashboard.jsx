import React from 'react';
import { sumHours, groupByOTI, groupByAssignee } from '../utils';

function AnimatedNumber({ target, suffix = "" }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const isFloat = String(target).includes(".");
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

function FlipCard({ label, value, accent, valueSize = 32, items, renderItem }) {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div
      className={"flip-card" + (flipped ? " flipped" : "")}
      style={{ height: "100%" }}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="flip-card-inner" style={{ height: "100%" }}>
        <div className="flip-card-front">
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--text3)" }}>
            {label}
          </div>
          <div style={{ fontSize: valueSize, fontWeight:700, color: accent, letterSpacing:"-0.03em", lineHeight:1 }}>
            <AnimatedNumber target={value} />
          </div>
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

function StatCard({ label, value, suffix = "", accent, sub }) {
  return (
    <div className="bento-stat" style={{ "--card-accent": accent }}>
      <div className="bento-stat-label">{label}</div>
      <div className="bento-stat-value" style={{ color: accent }}>
        <AnimatedNumber target={value} suffix={suffix} />
      </div>
      {sub && <div className="bento-stat-sub">{sub}</div>}
    </div>
  );
}

function Dashboard({ logs }) {
  const grouped     = React.useMemo(() => groupByOTI(logs), [logs]);
  const totalHours  = sumHours(logs);
  const totalOTIs   = Object.keys(grouped).length;
  const totalDays   = new Set(logs.map(l => l.date)).size;
  const avgPerDay   = totalDays > 0 ? Math.round((totalHours / totalDays) * 10) / 10 : 0;
  const byAssignee  = groupByAssignee(logs);
  const memberCount = Object.keys(byAssignee).length;

  const weekStart = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return d.toISOString().slice(0, 10);
  }, []);

  const thisWeekHours = React.useMemo(
    () => Math.round(sumHours(logs.filter(l => l.date >= weekStart)) * 10) / 10,
    [logs, weekStart]
  );

  const membersThisWeek = React.useMemo(
    () => new Set(logs.filter(l => l.date >= weekStart).map(l => l.assignee)).size,
    [logs, weekStart]
  );

  const allEntries = Object.entries(grouped);
  const inProgress = allEntries.filter(([,e]) => e.some(l => l.status === "In Progress"));
  const completed  = allEntries.filter(([,e]) => e[e.length-1]?.status === "Completed");
  const blocked    = allEntries.filter(([,e]) => e.some(l => l.status === "Blocked"));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-label">Overview</div>
      <div className="bento-grid">

        <div className="bento-hero">
          <FlipCard
            label="In Progress"
            value={inProgress.length}
            accent="var(--amber)"
            valueSize={52}
            items={inProgress}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
        </div>

        <div className="bento-mid">
          <FlipCard
            label="Completed"
            value={completed.length}
            accent="var(--green)"
            valueSize={36}
            items={completed}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
        </div>

        <div className="bento-mid">
          <FlipCard
            label="Blocked"
            value={blocked.length}
            accent="var(--red)"
            valueSize={36}
            items={blocked}
            renderItem={([otiId, entries]) => (
              <>
                <span style={{ fontSize:12, fontWeight:600, color:"var(--indigo)" }}>{otiId}</span>
                <span style={{ fontSize:11, color:"var(--text2)" }}>{entries[0].assignee}</span>
              </>
            )}
          />
        </div>

        <StatCard
          label="Total Hours"
          value={totalHours}
          suffix="h"
          accent="var(--indigo)"
          sub={`${thisWeekHours}h this week`}
        />
        <StatCard
          label="Avg / Day"
          value={avgPerDay}
          suffix="h"
          accent="var(--text2)"
          sub={`across ${totalDays} days`}
        />
        <StatCard
          label="Total OTIs"
          value={totalOTIs}
          accent="var(--indigo)"
          sub={`${inProgress.length} currently active`}
        />
        <StatCard
          label="Team Members"
          value={memberCount}
          accent="var(--green)"
          sub={`${membersThisWeek} logged this week`}
        />

      </div>
    </div>
  );
}

export default Dashboard;
