import React from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, parseExcelJSON, downloadTemplate, statusStyle } from '../utils';

function ImportModal({ onImport, existingLogs = [], onClose }) {
  const [stage,        setStage]        = React.useState("upload");
  const [diff,         setDiff]         = React.useState(null);
  const [error,        setError]        = React.useState("");
  const [dragging,     setDragging]     = React.useState(false);
  const [activeTab,    setActiveTab]    = React.useState("all");
  const [showUnchanged,setShowUnchanged]= React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState(new Set());
  const fileRef = React.useRef();

  function computeDiff(incoming) {
    const existingMap = {};
    existingLogs.forEach(l => { existingMap[`${l.otiId}|${l.date}|${l.assignee}`] = l; });
    const incomingMap = {};
    incoming.logs.forEach(r => { incomingMap[`${r.otiId}|${r.date}|${r.assignee}`] = r; });

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
        if (existing.assignee      !== row.assignee)      cf.push("assignee");
        rows.push(cf.length > 0
          ? { type:"changed",   old:existing, new:row, changedFields:cf }
          : { type:"unchanged", old:existing, new:row, changedFields:[] }
        );
      }
    });
    existingLogs.forEach(l => {
      if (!incomingMap[`${l.otiId}|${l.date}|${l.assignee}`])
        rows.push({ type:"deleted", old:l, new:null, changedFields:[] });
    });

    const order = { changed:0, added:1, deleted:2, unchanged:3 };
    rows.sort((a,b) => order[a.type] - order[b.type]);
    return {
      rows,
      added:     rows.filter(r=>r.type==="added").length,
      changed:   rows.filter(r=>r.type==="changed").length,
      deleted:   rows.filter(r=>r.type==="deleted").length,
      unchanged: rows.filter(r=>r.type==="unchanged").length,
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
          setExpandedRows(new Set());
          setStage("preview");
          setError("");
        } catch(de) { setError("Error processing file: " + de.message); }
      } catch(err) { setError("Could not read file: " + err.message); }
    };
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  function handleDrop(e) { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }

  function handleConfirm() {
    const toAdd    = diff.rows.filter(r=>r.type==="added").map(r=>r.new);
    const toUpdate = diff.rows.filter(r=>r.type==="changed").map(r=>r.new);
    onImport([...toAdd,...toUpdate], "merge");
    onClose();
  }

  function toggleExpand(i) {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const isFirstImport = existingLogs.length === 0;
  const EMPTY = "—";

  const rowBorderLeft = t =>
    t==="added"?"3px solid #10b981":t==="changed"?"3px solid #f59e0b":
    t==="deleted"?"3px solid #ef4444":"3px solid transparent";
  const rowBg = t =>
    t==="added"?"rgba(16,185,129,0.05)":t==="changed"?"rgba(245,158,11,0.05)":
    t==="deleted"?"rgba(239,68,68,0.05)":"transparent";

  // All fields for expanded detail view
  const ALL_FIELDS = [
    { key:"otiId",     label:"OTI ID"     },
    { key:"title",     label:"Title"      },
    { key:"assignee",  label:"Assignee"   },
    { key:"date",      label:"Date"       },
    { key:"status",    label:"Status"     },
    { key:"priority",  label:"Priority"   },
    { key:"hours",     label:"Hours"      },
    { key:"startTime", label:"Start"      },
    { key:"endTime",   label:"End"        },
    { key:"notes",     label:"Notes"      },
  ];

  // Smart columns for changed rows — always show OTI ID + Date + changed fields
  function getSmartCols(row) {
    const base = ["otiId","date"];
    if (row.type === "changed") {
      const extras = row.changedFields.filter(f => !base.includes(f));
      return [...base, ...extras];
    }
    return [...base, "hours","status"];
  }

  function FieldVal({ val, isChanged, oldVal, field }) {
    if (val === null || val === undefined || val === "") return <span style={{ color:"var(--text3)" }}>{EMPTY}</span>;
    const display = field === "hours" ? `${val}h` : val;
    if (isChanged && oldVal !== undefined && String(oldVal) !== String(val)) {
      const oldDisplay = field === "hours" ? `${oldVal}h` : oldVal;
      return (
        <span>
          <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:4, fontSize:11 }}>{oldDisplay}</span>
          <span style={{ color:"#fbbf24", fontWeight:600 }}>{display}</span>
        </span>
      );
    }
    if (field === "status") return <span className="badge" style={statusStyle(val)}>{val}</span>;
    return <span>{display}</span>;
  }

  function DiffRow({ row, idx }) {
    const o   = row.old;
    const n   = row.new;
    const cf  = row.changedFields || [];
    const exp = expandedRows.has(idx);
    const smartCols = getSmartCols(row);
    const cs  = { padding:"7px 10px", fontSize:12 };

    return (
      <>
        <tr style={{ background:rowBg(row.type), borderLeft:rowBorderLeft(row.type),
                     borderBottom: exp ? "none" : "1px solid rgba(255,255,255,0.04)",
                     cursor:"pointer" }}
            onClick={() => toggleExpand(idx)}>

          {/* Expand arrow */}
          <td style={{ ...cs, width:28, color:"var(--text3)", fontSize:10, userSelect:"none" }}>
            {exp ? "▼" : "▶"}
          </td>

          {/* Smart columns — left (existing) */}
          {smartCols.map((f,i) => (
            <td key={"l"+f} style={{ ...cs, color: f==="otiId" ? "var(--indigo)" : "var(--text2)",
              fontWeight: f==="otiId" ? 600 : 400,
              borderRight: i===smartCols.length-1 ? "2px solid var(--border2)" : "none" }}>
              {o ? (f==="status"
                ? <span className="badge" style={statusStyle(o[f])}>{o[f]}</span>
                : f==="hours" ? `${o[f]}h` : o[f] || EMPTY)
              : <span style={{ color:"var(--text3)" }}>{EMPTY}</span>}
            </td>
          ))}

          {/* Smart columns — right (incoming) */}
          {smartCols.map(f => (
            <td key={"r"+f} style={{ ...cs }}>
              {n
                ? <FieldVal val={n[f]} oldVal={o?.[f]} isChanged={cf.includes(f)} field={f}/>
                : <span style={{ color:"var(--text3)" }}>{EMPTY}</span>}
            </td>
          ))}
        </tr>

        {/* Expanded detail panel — all fields */}
        {exp && (
          <tr style={{ background: rowBg(row.type), borderLeft:rowBorderLeft(row.type),
                       borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <td></td>
            <td colSpan={smartCols.length * 2 + 1} style={{ padding:"0 10px 12px" }}>
              <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"10px 14px",
                            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"8px 16px" }}>
                {ALL_FIELDS.map(({ key, label }) => {
                  const oldV = o?.[key];
                  const newV = n?.[key];
                  const changed = cf.includes(key);
                  return (
                    <div key={key}>
                      <div style={{ fontSize:10, color:"var(--text3)", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:2 }}>
                        {label}
                        {changed && <span style={{ color:"#f59e0b", marginLeft:4 }}>✎</span>}
                      </div>
                      <div style={{ fontSize:12 }}>
                        {/* Left value */}
                        <span style={{ color:"var(--text3)", fontSize:11 }}>
                          {oldV !== null && oldV !== undefined && oldV !== ""
                            ? (key==="hours" ? `${oldV}h` : oldV) : EMPTY}
                        </span>
                        {changed && (
                          <span style={{ color:"var(--text3)", margin:"0 6px" }}>→</span>
                        )}
                        {/* Right value — only show if different */}
                        {changed && (
                          <span style={{ color:"#fbbf24", fontWeight:600, fontSize:12 }}>
                            {newV !== null && newV !== undefined && newV !== ""
                              ? (key==="hours" ? `${newV}h` : newV) : EMPTY}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

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
        {label} {count > 0 && <span style={{ opacity:0.8 }}>({count})</span>}
      </button>
    );
  }

  function LegendPill({ color, label }) {
    return (
      <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20,
        border:`1.5px solid ${color}`, background:`${color}22`, color:color }}>
        {label}
      </span>
    );
  }

  // Compute visible rows based on active tab
  const visibleRows = React.useMemo(() => {
    if (!diff) return { important:[], unchanged:[] };
    let rows = activeTab === "all" ? diff.rows : diff.rows.filter(r => r.type === activeTab);
    if (activeTab === "all") {
      return {
        important: rows.filter(r => r.type !== "unchanged"),
        unchanged: rows.filter(r => r.type === "unchanged"),
      };
    }
    return { important: rows, unchanged: [] };
  }, [diff, activeTab]);

  // Dynamic column headers based on first important row's smart cols
  const smartColHeaders = React.useMemo(() => {
    if (!diff || visibleRows.important.length === 0) return ["OTI ID","Date","Hours","Status"];
    const firstChanged = diff.rows.find(r => r.type === "changed");
    if (firstChanged) {
      return getSmartCols(firstChanged).map(f =>
        ALL_FIELDS.find(a => a.key === f)?.label || f
      );
    }
    return ["OTI ID","Date","Hours","Status"];
  }, [diff, visibleRows]);

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
                : "Upload a file — a side-by-side diff shows exactly what will change before anything is applied."}
              {" "}<span style={{ color:"var(--indigo)", cursor:"pointer", textDecoration:"underline" }}
                onClick={downloadTemplate}>Download template</span>
            </p>
            <div
              onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current.click()}
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
                     onChange={e=>handleFile(e.target.files[0])} />
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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0 }}>{isFirstImport ? "Preview import" : "Review changes"}</h3>
              <button onClick={onClose} style={{ background:"none", border:"none",
                color:"var(--text3)", fontSize:18, cursor:"pointer" }}>✕</button>
            </div>

            {/* Filter tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
              <TabPill id="all"       count={diff.rows.length} color="#6366f1" label="All"/>
              <TabPill id="added"     count={diff.added}       color="#10b981" label="New"/>
              <TabPill id="changed"   count={diff.changed}     color="#f59e0b" label="Changed"/>
              <TabPill id="deleted"   count={diff.deleted}     color="#ef4444" label="Removed"/>
              <TabPill id="unchanged" count={diff.unchanged}   color="#6b7280" label="Unchanged"/>
            </div>

            {diff.warnings.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
                            borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--amber)" }}>
                  ⚠ {diff.warnings.length} row{diff.warnings.length!==1?"s":""} need review
                </div>
              </div>
            )}

            {/* Hint */}
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8 }}>
              Click any row to expand all fields · Changed fields shown with old → new value
            </div>

            {/* Table */}
            <div style={{ flex:1, overflowY:"auto", borderRadius:8,
                          border:"1px solid var(--border)", marginBottom:12 }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead style={{ position:"sticky", top:0, zIndex:10 }}>
                  <tr>
                    <th style={{ width:28, background:"var(--surface2)",
                      borderBottom:"1px solid var(--border)" }}></th>
                    <th colSpan={smartColHeaders.length}
                        style={{ background:"rgba(99,102,241,0.1)", padding:"7px 10px",
                          fontSize:10, fontWeight:700, color:"var(--text2)",
                          letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"left",
                          borderBottom:"1px solid var(--border)",
                          borderRight:"2px solid var(--border2)" }}>
                      ← Existing
                    </th>
                    <th colSpan={smartColHeaders.length}
                        style={{ background:"rgba(16,185,129,0.07)", padding:"7px 10px",
                          fontSize:10, fontWeight:700, color:"var(--text2)",
                          letterSpacing:"0.08em", textTransform:"uppercase", textAlign:"left",
                          borderBottom:"1px solid var(--border)" }}>
                      Incoming →
                    </th>
                  </tr>
                  <tr style={{ background:"var(--surface2)" }}>
                    <th style={{ borderBottom:"1px solid var(--border)" }}></th>
                    {smartColHeaders.map((h,i) => (
                      <th key={"lh"+h} style={{ padding:"6px 10px", fontSize:10,
                        color:"var(--text3)", textAlign:"left", fontWeight:500,
                        borderBottom:"1px solid var(--border)",
                        borderRight: i===smartColHeaders.length-1 ? "2px solid var(--border2)" : "none" }}>
                        {h}
                      </th>
                    ))}
                    {smartColHeaders.map(h => (
                      <th key={"rh"+h} style={{ padding:"6px 10px", fontSize:10,
                        color:"var(--text3)", textAlign:"left", fontWeight:500,
                        borderBottom:"1px solid var(--border)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.important.map((row,i) => (
                    <DiffRow key={i} row={row} idx={i}/>
                  ))}

                  {visibleRows.unchanged.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={smartColHeaders.length*2+2}
                            style={{ padding:"8px 12px", textAlign:"center",
                              background:"rgba(255,255,255,0.02)",
                              borderTop:"1px solid var(--border)",
                              borderBottom:"1px solid var(--border)" }}>
                          <button onClick={()=>setShowUnchanged(v=>!v)} style={{
                            background:"none", border:"1px solid var(--border2)",
                            color:"var(--text3)", fontSize:11, padding:"4px 14px",
                            borderRadius:20, cursor:"pointer",
                          }}>
                            {showUnchanged?"▲ Hide":"▼ Show"} {visibleRows.unchanged.length} unchanged rows
                          </button>
                        </td>
                      </tr>
                      {showUnchanged && visibleRows.unchanged.map((row,i) => (
                        <DiffRow key={"u"+i} row={row} idx={1000+i}/>
                      ))}
                    </>
                  )}

                  {visibleRows.important.length===0 && visibleRows.unchanged.length===0 && (
                    <tr><td colSpan={smartColHeaders.length*2+2}
                      style={{ padding:"24px", textAlign:"center", color:"var(--text3)", fontSize:13 }}>
                      No rows to show
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend using pills */}
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:11, color:"var(--text3)", marginRight:4 }}>Legend:</span>
              <LegendPill color="#10b981" label="New row"/>
              <LegendPill color="#f59e0b" label="Changed"/>
              <LegendPill color="#ef4444" label="Removed"/>
              <LegendPill color="#6b7280" label="Unchanged"/>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, justifyContent:"space-between",
                          alignItems:"center", flexShrink:0 }}>
              <button className="btn-ghost"
                onClick={()=>{ setStage("upload"); setDiff(null); }}>Back</button>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                {!isFirstImport && diff.added===0 && diff.changed===0 && (
                  <span style={{ fontSize:12, color:"var(--text3)" }}>No new changes to apply</span>
                )}
                <button className="btn"
                  disabled={!isFirstImport && diff.added===0 && diff.changed===0}
                  onClick={handleConfirm}
                  style={{ opacity:(!isFirstImport&&diff.added===0&&diff.changed===0)?0.4:1 }}>
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
