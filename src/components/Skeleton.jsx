import React from 'react';

function S({ width = "100%", height = 14, radius = 6, style = {} }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

function SkeletonTableRows({ rows, cols }) {
  return (
    <>
      <div style={{ display:"flex", gap:8, paddingBottom:8, borderBottom:"1px solid var(--border)", marginBottom:4 }}>
        {cols.map((w, i) => <S key={i} width={`${w}%`} height={10} />)}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{ display:"flex", gap:8, padding:"10px 0", borderBottom: i < rows - 1 ? "1px solid var(--border)" : "none" }}>
          {cols.map((w, j) => <S key={j} width={`${w}%`} height={13} />)}
        </div>
      ))}
    </>
  );
}

export function SkeletonAnalytics() {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <S width={60} height={30} style={{ marginBottom:10 }} />
            <S width="65%" height={13} style={{ marginBottom:6 }} />
            <S width="45%" height={11} />
          </div>
        ))}
      </div>
      <div className="card">
        <S width={130} height={10} style={{ marginBottom:16 }} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height:130, borderRadius:12 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonOTIs() {
  return (
    <div>
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:"flex", gap:10, marginBottom:12 }}>
          <S height={36} style={{ flex:2 }} radius={8} />
          <S height={36} style={{ flex:1 }} radius={8} />
          <S width={110} height={36} radius={8} />
          <S width={130} height={36} radius={8} />
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[80, 100, 90, 70].map((w, i) => <S key={i} width={w} height={28} radius={20} />)}
          <div style={{ width:1, height:28, background:"var(--border2)", margin:"0 4px", flexShrink:0 }} />
          {[50, 65, 75, 55, 50, 65].map((w, i) => <S key={i} width={w} height={28} radius={20} />)}
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card" style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <S width={80} height={20} radius={6} />
            <S width={72} height={20} radius={20} />
            <S width={58} height={20} radius={20} />
          </div>
          <S width="48%" height={18} style={{ marginBottom:14 }} />
          <div style={{ display:"flex", gap:20 }}>
            {[52, 65, 55, 68, 58].map((w, j) => <S key={j} width={w} height={11} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonWeekly() {
  return (
    <div>
      <div className="card" style={{ padding:"1rem 1.5rem", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <S width={100} height={11} />
          <S width={160} height={34} radius={8} />
        </div>
      </div>
      {[3, 4, 2].map((rows, i) => (
        <div key={i} className="card">
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <S width={200} height={14} style={{ marginBottom:6 }} />
              <S width={160} height={11} />
            </div>
          </div>
          <SkeletonTableRows rows={rows} cols={[13, 35, 20, 18]} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonWorkload() {
  return (
    <div>
      {[3, 2, 4].map((rows, i) => (
        <div key={i} className="card">
          <div style={{ marginBottom:16 }}>
            <S width={120} height={14} style={{ marginBottom:6 }} />
            <S width={180} height={11} />
          </div>
          <SkeletonTableRows rows={rows} cols={[14, 32, 18, 16, 18]} />
        </div>
      ))}
    </div>
  );
}
