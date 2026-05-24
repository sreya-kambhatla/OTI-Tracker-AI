import React from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, parseExcelJSON, downloadTemplate, statusStyle } from '../utils';

function ImportModal({ onImport, existingLogs = [], onClose }) {
  const [stage,    setStage]    = React.useState("upload");
  const [diff,     setDiff]     = React.useState(null);
  const [error,    setError]    = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("all");
  const [showUnchanged, setShowUnchanged] = React.useState(false);
  const fileRef = React.useRef();

  function computeDiff(incoming) {
    const existingMap = {};
    existingLogs.forEach(l => {
      existingMap[`${l.otiId}|${l.date}|${l.assignee}`] = l;
    });
    const incomingMap = {};
    incoming.logs.forEach(r => {
      incomingMap[`${r.otiId}|${r.date}|${r.assignee}`] = r;
    });

    const rows = [];

    incoming.logs.forEach(row => {
      const key = `${row.otiId}|${row.date}|${row.assignee}`;
      const existing = existingMap[key];
      if (!existing) {
        rows.push({ type:"added", old:null, new:row, changedFields:[] });
      } else {
        const cf = [];
        if (String(existing.hours) !== String(row.hours)) cf.push("hours");
        if (existing.status        !== row.status)        cf.push("status");
        if (existing.priority      !== row.priority)      cf.push("priority");
        if ((existing.notes||"")   !== (row.notes||""))   cf.push("notes");
        if (existing.title         !== row.title)         cf.push("title");
        rows.push(cf.length > 0
          ? { type:"changed",   old:existing, new:row, changedFields:cf }
          : { type:"unchanged", old:existing, new:row, changedFields:[] }
        );
      }
    });

    existingLogs.forEach(l => {
      const key = `${l.otiId}|${l.date}|${l.assignee}`;
      if (!incomingMap[key]) rows.push({ type:"deleted", old:l, new:null, changedFields:[] });
    });

    const order = { changed:0, added:1, deleted:2, unchanged:3 };
    rows.sort((a,b) => order[a.type] - order[b.type]);

    return {
      rows,
      added:     rows.filter(r => r.type==="added").length,
      changed:   rows.filter(r => r.type==="changed").length,
      deleted:   rows.filter(r => r.type==="deleted").length,
      unchanged: rows.filter(r => r.type==="unchanged").length,
      warnings:  incoming.errors,
    };
  }

  function handleFile(file) {
    if (!file || (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls"))) {
      setError("Please select a .csv, .xlsx, or .xls file."); return;
    }
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const reader  = new FileReader();
    reader.onload = e => {
      try {
        let result;
        if (isExcel) {
          const wb   = XLSX.read(e.target.result, { type:"array", cellDates:false });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval:"" });
          result     = parseExcelJSON(json);
        } else {
          result = parseCSV(e.target.result);
        }
        if (result.error) { setError(result.error); return; }
        try {
          const d = computeDiff(result);
          setDiff(d);
          setActiveTab("all");
          setShowUnchanged(false);
          setStage("preview");
          setError("");
        } catch(diffErr) { setError("Error processing file: " + diffErr.message); }
      } catch(err) { setError("Could not read file: " + err.message); }
    };
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleConfirm() {
    const toAdd    = diff.rows.filter(r => r.type==="added").map(r => r.new);
    const toUpdate = diff.rows.filter(r => r.type==="changed").map(r => r.new);
    onImport([...toAdd, ...toUpdate], "merge");
    onClose();
  }

  const isFirstImport = existingLogs.length === 0;
  const EMPTY = "—";

  // ── row/cell helpers ─────────────────────────────────────────────
  const rowBorderLeft = (type) =>
    type==="added"    ? "3px solid #10b981" :
    type==="changed"  ? "3px solid #f59e0b" :
    type==="deleted"  ? "3px solid #ef4444" :
                        "3px solid transparent";

  const rowBg = (type) =>
    type==="added"    ? "rgba(16,185,129,0.05)"  :
    type==="changed"  ? "rgba(245,158,11,0.05)"  :
    type==="deleted"  ? "rgba(239,68,68,0.05)"   :
                        "transparent";

  // ── filtered rows ────────────────────────────────────────────────
  function getVisibleRows() {
    if (!diff) return [];
    let rows = diff.rows;
    if (activeTab !== "all") rows = rows.filter(r => r.type === activeTab);
    if (activeTab === "all" && !showUnchanged) {
      const important = rows.filter(r => r.type !== "unchanged");
      const unchanged = rows.filter(r => r.type === "unchanged");
      return { important, unchanged, collapsed: !showUnchanged };
    }
    return { important: rows, unchanged: [], collapsed: false };
  }

  function DiffRow({ row }) {
    const o  = row.old;
    const n  = row.new;
    const cf = row.changedFields || [];

    const cellSt = { padding:"7px 10px", fontSize:12 };
    const divider = { borderRight:"2px solid var(--border2)" };

    function Val({ field, oldVal, newVal, isRight }) {
      const changed = cf.includes(field);
      if (isRight) {
        if (newVal === null || newVal === undefined) return <td style={cellSt}><span style={{ color:"var(--text3)" }}>{EMPTY}</span></td>;
        if (changed) return (
          <td style={cellSt}>
            <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:5, fontSize:11 }}>{oldVal}{field==="hours"?"h":""}</span>
            <span style={{ color:"#fbbf24", fontWeight:600 }}>{newVal}{field==="hours"?"h":""}</span>
          </td>
        );
        return <td style={cellSt}>{field==="hours" ? `${newVal}h` : newVal}</td>;
      } else {
        if (oldVal === null || oldVal === undefined) return <td style={{...cellSt, color:"var(--text3)"}}>{EMPTY}</td>;
        return <td style={{...cellSt, color: changed ? "var(--text3)" : "var(--text)"}}>{field==="hours" ? `${oldVal}h` : oldVal}</td>;
      }
    }

    return (
      <tr style={{ background:rowBg(row.type), borderLeft:rowBorderLeft(row.type),
                   borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        {/* Left side */}
        <td style={{...cellSt, color:"var(--indigo)", fontWeight:600}}>{o ? o.otiId : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}</td>
        <td style={{...cellSt, color:"var(--text2)"}}>{o ? o.date : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}</td>
        <Val field="hours"  oldVal={o?.hours}  newVal={n?.hours}  isRight={false}/>
        <td style={{...cellSt,...divider}}>
          {o ? <span className="badge" style={statusStyle(o.status)}>{o.status}</span>
             : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}
        </td>
        {/* Right side */}
        <td style={{...cellSt, color:"var(--indigo)", fontWeight:600}}>{n ? n.otiId : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}</td>
        <td style={{...cellSt, color:"var(--text2)"}}>{n ? n.date : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}</td>
        <Val field="hours"  oldVal={o?.hours}  newVal={n?.hours}  isRight={true}/>
        <td style={cellSt}>
          {n ? (cf.includes("status") ? (
            <span>
              <span style={{textDecoration:"line-through",color:"var(--text3)",marginRight:4,fontSize:11}}>{o.status}</span>
              <span className="badge" style={statusStyle(n.status)}>{n.status}</span>
            </span>
          ) : <span className="badge" style={statusStyle(n.status)}>{n.status}</span>)
          : <span style={{color:"var(--text3)"}}>{EMPTY}</span>}
        </td>
      </tr>
    );
  }

  // ── tab pill ─────────────────────────────────────────────────────
  function TabPill({ id, count, color, label }) {
    const active = activeTab === id;
    return (
      <button onClick={() => setActiveTab(id)} style={{
        fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20,
        border: active ? `1.5px solid ${color}` : "1.5px solid transparent",
        background: active ? `${color}22` : "rgba(255,255,255,0.04)",
        color: active ? color : "var(--text3)",
        cursor:"pointer", transition:"all 0.15s",
      }}>
        {label} {count > 0 && <span style={{opacity:0.8}}>({count})</span>}
      </button>
    );
  }

  const visible = diff ? getVisibleRows() : { important:[], unchanged:[], collapsed:false };

  return (
    <div className="modal-overlay">
      <div className="modal"
           style={{ width:"min(920px,96vw)", maxHeight:"92vh", display:"flex",
                    flexDirection:"column", padding:"1.5rem" }}
           onClick={e => e.stopPropagation()}>

        {/* ── UPLOAD STAGE ── */}
        {stage === "upload" && (
          <>
            <h3 style={{ marginBottom:8 }}>Import data</h3>
            <p style={{ marginBottom:16, color:"var(--text2)", fontSize:13 }}>
              {isFirstImport
                ? "Upload your Excel or CSV file to get started."
                : "Upload a file — a side-by-side diff will show exactly what will change before anything is applied."}
              {" "}<span style={{ color:"var(--indigo)", cursor:"pointer", textDecoration:"underline" }}
                onClick={downloadTemplate}>Download template</span>
            </p>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border:"2px dashed "+(dragging?"var(--indigo)":"var(--border2)"),
                borderRadius:12, padding:"2.5rem 2rem", textAlign:"center",
                cursor:"pointer", marginBottom:20, transition:"border-color 0.2s",
                background: dragging ? "var(--indigo-bg)" : "var(--surface2)",
              }}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:14, color:"var(--text)", fontWeight:500, marginBottom:4 }}>
                Drop your file here or click to browse
              </div>
              <div style={{ fontSize:12, color:"var(--text3)" }}>Supports .xlsx, .xls, and .csv</div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:"none" }}
                     onChange={e => handleFile(e.target.files[0])} />
            </div>
            {error && <div style={{ fontSize:12, color:"var(--red)", marginBottom:16 }}>{error}</div>}
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button className="btn-ghost" style={{ fontSize:12 }} onClick={downloadTemplate}>Download template</button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {/* ── DIFF STAGE ── */}
        {stage === "preview" && diff && (
          <>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0 }}>{isFirstImport ? "Preview import" : "Review changes"}</h3>
              <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--text3)",
                fontSize:18, cursor:"pointer", lineHeight:1 }}>✕</button>
            </div>

            {/* Filter tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
              <TabPill id="all"       count={diff.rows.length} color="#6366f1" label="All"/>
              <TabPill id="added"     count={diff.added}       color="#10b981" label="New"/>
              <TabPill id="changed"   count={diff.changed}     color="#f59e0b" label="Changed"/>
              <TabPill id="deleted"   count={diff.deleted}     color="#ef4444" label="Removed"/>
              <TabPill id="unchanged" count={diff.unchanged}   color="#6b7280" label="Unchanged"/>
            </div>

            {/* Warnings */}
            {diff.warnings.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
                            borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--amber)" }}>
                  ⚠ {diff.warnings.length} row{diff.warnings.length!==1?"s":""} need review before importing
                </div>
              </div>
            )}

            {/* Table */}
            <div style={{ flex:1, overflowY:"auto", borderRadius:8, border:"1px solid var(--border)", marginBottom:12 }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                  <tr>
                    <th colSpan={4} style={{ background:"rgba(99,102,241,0.1)", padding:"7px 10px",
                      fontSize:10, fontWeight:700, color:"var(--text2)", letterSpacing:"0.08em",
                      textTransform:"uppercase", textAlign:"left",
                      borderBottom:"1px solid var(--border)", borderRight:"2px solid var(--border2)" }}>
                      ← Existing (dashboard)
                    </th>
                    <th colSpan={4} style={{ background:"rgba(16,185,129,0.07)", padding:"7px 10px",
                      fontSize:10, fontWeight:700, color:"var(--text2)", letterSpacing:"0.08em",
                      textTransform:"uppercase", textAlign:"left",
                      borderBottom:"1px solid var(--border)" }}>
                      Incoming (file) →
                    </th>
                  </tr>
                  <tr style={{ background:"var(--surface2)" }}>
                    {["OTI ID","Date","Hours","Status"].map((h,i) => (
                      <th key={"l"+h} style={{ padding:"6px 10px", fontSize:10, color:"var(--text3)",
                        textAlign:"left", borderBottom:"1px solid var(--border)",
                        borderRight: i===3 ? "2px solid var(--border2)" : "none",
                        fontWeight:500 }}>{h}</th>
                    ))}
                    {["OTI ID","Date","Hours","Status"].map(h => (
                      <th key={"r"+h} style={{ padding:"6px 10px", fontSize:10, color:"var(--text3)",
                        textAlign:"left", borderBottom:"1px solid var(--border)", fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Important rows — always visible */}
                  {visible.important.map((row,i) => <DiffRow key={i} row={row}/>)}

                  {/* Unchanged rows — collapsible in "all" tab */}
                  {visible.unchanged.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={8} style={{ padding:"8px 12px", textAlign:"center",
                          background:"rgba(255,255,255,0.02)",
                          borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
                          <button onClick={() => setShowUnchanged(v => !v)} style={{
                            background:"none", border:"1px solid var(--border2)", color:"var(--text3)",
                            fontSize:11, padding:"4px 14px", borderRadius:20, cursor:"pointer",
                          }}>
                            {showUnchanged ? "▲ Hide" : "▼ Show"} {visible.unchanged.length} unchanged rows
                          </button>
                        </td>
                      </tr>
                      {showUnchanged && visible.unchanged.map((row,i) => <DiffRow key={"u"+i} row={row}/>)}
                    </>
                  )}

                  {visible.important.length === 0 && visible.unchanged.length === 0 && (
                    <tr><td colSpan={8} style={{ padding:"24px", textAlign:"center", color:"var(--text3)", fontSize:13 }}>
                      No rows to show
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:12, marginBottom:12, flexWrap:"wrap" }}>
              {[
                { color:"#10b981", bg:"rgba(16,185,129,0.15)", label:"New row" },
                { color:"#f59e0b", bg:"rgba(245,158,11,0.15)",  label:"Changed — old value shown crossed out" },
                { color:"#ef4444", bg:"rgba(239,68,68,0.15)",   label:"Removed from file" },
                { color:"#6b7280", bg:"rgba(255,255,255,0.06)", label:"Unchanged" },
              ].map(({ color, bg, label }) => (
                <span key={label} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--text3)" }}>
                  <span style={{ display:"inline-block", width:10, height:10, borderRadius:3,
                    background:bg, border:`1.5px solid ${color}` }}/>
                  {label}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <button className="btn-ghost" onClick={() => { setStage("upload"); setDiff(null); }}>Back</button>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                {!isFirstImport && diff.added===0 && diff.changed===0 && (
                  <span style={{ fontSize:12, color:"var(--text3)" }}>No new changes to apply</span>
                )}
                <button className="btn"
                  disabled={!isFirstImport && diff.added===0 && diff.changed===0}
                  onClick={handleConfirm}
                  style={{ opacity:(!isFirstImport && diff.added===0 && diff.changed===0)?0.4:1 }}>
                  {isFirstImport
                    ? `Import ${diff.added} rows`
                    : `Apply ${diff.added+diff.changed} change${diff.added+diff.changed!==1?"s":""}`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
