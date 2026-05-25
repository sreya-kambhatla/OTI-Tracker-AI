import React from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, parseExcelJSON, downloadTemplate, statusStyle } from '../utils';

const EMPTY = "—";

// Fixed columns — identical for both left and right sides
const COLS = [
  { key:"otiId",    label:"OTI ID",   w:"15%" },
  { key:"date",     label:"Date",     w:"12%" },
  { key:"assignee", label:"Assignee", w:"12%" },
  { key:"hours",    label:"Hours",    w:"8%"  },
  { key:"status",   label:"Status",   w:"13%" },
  { key:"priority", label:"Priority", w:"10%" },
];

const ALL_DETAIL = [
  { key:"otiId",     label:"OTI ID"     },
  { key:"title",     label:"Title"      },
  { key:"assignee",  label:"Assignee"   },
  { key:"createdBy", label:"Created By" },
  { key:"date",      label:"Date"       },
  { key:"status",    label:"Status"     },
  { key:"priority",  label:"Priority"   },
  { key:"hours",     label:"Hours",     fmt: v => v ? `${v}h` : EMPTY },
  { key:"startTime", label:"Start"      },
  { key:"endTime",   label:"End"        },
  { key:"notes",     label:"Notes"      },
];

function fmtVal(col, row) {
  if (!row) return EMPTY;
  const v = row[col.key];
  if (v === null || v === undefined || v === "") return EMPTY;
  if (col.key === "hours") return `${v}h`;
  return String(v);
}

function ImportModal({ onImport, existingLogs = [], onClose }) {
  const [stage,         setStage]         = React.useState("upload");
  const [diff,          setDiff]          = React.useState(null);
  const [error,         setError]         = React.useState("");
  const [dragging,      setDragging]      = React.useState(false);
  const [activeTab,     setActiveTab]     = React.useState("all");
  const [showUnchanged, setShowUnchanged] = React.useState(false);
  const [expanded,      setExpanded]      = React.useState(new Set());
  const fileRef = React.useRef();

  // ── compute diff ────────────────────────────────────────────────
  function computeDiff(incoming) {
    const existMap = {};
    existingLogs.forEach(l => { existMap[`${l.otiId}|${l.date}|${l.assignee}`] = l; });
    const inMap = {};
    incoming.logs.forEach(r => { inMap[`${r.otiId}|${r.date}|${r.assignee}`] = r; });

    const rows = [];
    incoming.logs.forEach(row => {
      const key = `${row.otiId}|${row.date}|${row.assignee}`;
      const ex  = existMap[key];
      if (!ex) {
        rows.push({ type:"added", old:null, new:row, cf:[] });
      } else {
        const cf = [];
        if (String(ex.hours) !== String(row.hours)) cf.push("hours");
        if (ex.status    !== row.status)    cf.push("status");
        if (ex.priority  !== row.priority)  cf.push("priority");
        if ((ex.notes||"") !== (row.notes||"")) cf.push("notes");
        if (ex.title     !== row.title)     cf.push("title");
        if (ex.assignee  !== row.assignee)  cf.push("assignee");
        rows.push(cf.length > 0
          ? { type:"changed",   old:ex, new:row, cf }
          : { type:"unchanged", old:ex, new:row, cf:[] }
        );
      }
    });
    existingLogs.forEach(l => {
      if (!inMap[`${l.otiId}|${l.date}|${l.assignee}`])
        rows.push({ type:"deleted", old:l, new:null, cf:[] });
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

  // ── file handling ────────────────────────────────────────────────
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
          setDiff(computeDiff(result));
          setActiveTab("all");
          setShowUnchanged(false);
          setExpanded(new Set());
          setStage("preview");
          setError("");
        } catch(de) { setError("Error processing: " + de.message); }
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
    setExpanded(prev => { const s=new Set(prev); s.has(i)?s.delete(i):s.add(i); return s; });
  }

  const isFirstImport = existingLogs.length === 0;

  // ── row styling ──────────────────────────────────────────────────
  const rowBg = t =>
    t==="added"?"rgba(16,185,129,0.05)":t==="changed"?"rgba(245,158,11,0.05)":
    t==="deleted"?"rgba(239,68,68,0.05)":"transparent";
  const rowBorderLeft = t =>
    t==="added"?"3px solid #10b981":t==="changed"?"3px solid #f59e0b":
    t==="deleted"?"3px solid #ef4444":"3px solid transparent";

  // ── sub-components ───────────────────────────────────────────────
  function TabPill({ id, count, color, label }) {
    const active = activeTab === id;
    return (
      <button onClick={()=>setActiveTab(id)} style={{
        fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:20, cursor:"pointer",
        border: active ? `1.5px solid ${color}` : "1.5px solid transparent",
        background: active ? `${color}22` : "rgba(255,255,255,0.04)",
        color: active ? color : "var(--text3)", transition:"all 0.15s",
      }}>
        {label}{count>0 && <span style={{opacity:0.8}}> ({count})</span>}
      </button>
    );
  }

  function LegendPill({ color, label }) {
    return (
      <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20,
        border:`1.5px solid ${color}`, background:`${color}22`, color }}>
        {label}
      </span>
    );
  }

  // ── single table row ─────────────────────────────────────────────
  function DiffRow({ row, rowIdx }) {
    const { old:o, new:n, cf, type } = row;
    const isExp = expanded.has(rowIdx);
    const cs = { padding:"7px 8px", fontSize:12, verticalAlign:"middle" };

    return (
      <>
        <tr
          onClick={()=>toggleExpand(rowIdx)}
          style={{ background:rowBg(type), borderLeft:rowBorderLeft(type),
                   borderBottom: isExp ? "none" : "1px solid rgba(255,255,255,0.04)",
                   cursor:"pointer" }}>

          {/* Arrow */}
          <td style={{...cs, width:24, textAlign:"center", color:"var(--text3)", fontSize:10, userSelect:"none"}}>
            {isExp?"▼":"▶"}
          </td>

          {/* ── LEFT SIDE (existing) ── */}
          {COLS.map((col, i) => {
            const val    = fmtVal(col, o);
            const isLast = i === COLS.length - 1;
            const dimmed = cf.includes(col.key); // dim changed fields on old side
            return (
              <td key={"L"+col.key} style={{
                ...cs, width: col.w,
                color: !o ? "var(--text3)" : dimmed ? "var(--text3)" : "var(--text)",
                borderRight: isLast ? "2px solid var(--border2)" : "none",
              }}>
                {!o
                  ? <span style={{color:"var(--text3)"}}>{EMPTY}</span>
                  : col.key === "status"
                    ? <span className="badge" style={statusStyle(o.status)}>{o.status}</span>
                    : <span style={dimmed?{textDecoration:"line-through"}:{}}>{val}</span>
                }
              </td>
            );
          })}

          {/* ── RIGHT SIDE (incoming) ── */}
          {COLS.map(col => {
            const newVal = fmtVal(col, n);
            const oldVal = fmtVal(col, o);
            const isChanged = cf.includes(col.key) && oldVal !== newVal;
            return (
              <td key={"R"+col.key} style={{...cs, width: col.w}}>
                {!n
                  ? <span style={{color:"var(--text3)"}}>{EMPTY}</span>
                  : col.key === "status"
                    ? isChanged
                      ? <span>
                          <span style={{textDecoration:"line-through",color:"var(--text3)",marginRight:4,fontSize:11}}>{oldVal}</span>
                          <span className="badge" style={statusStyle(n.status)}>{n.status}</span>
                        </span>
                      : <span className="badge" style={statusStyle(n.status)}>{n.status}</span>
                  : isChanged
                    ? <span>
                        <span style={{textDecoration:"line-through",color:"var(--text3)",marginRight:4,fontSize:11}}>{oldVal}</span>
                        <span style={{color:"#fbbf24",fontWeight:600}}>{newVal}</span>
                      </span>
                    : <span>{newVal}</span>
                }
              </td>
            );
          })}
        </tr>

        {/* Expanded detail panel */}
        {isExp && (
          <tr style={{ background:rowBg(type), borderLeft:rowBorderLeft(type),
                       borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <td></td>
            <td colSpan={COLS.length * 2} style={{ padding:"0 8px 12px" }}>
              <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:8, padding:"10px 14px",
                            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:"8px 16px" }}>
                {ALL_DETAIL.map(({ key, label, fmt }) => {
                  const oldV   = o?.[key];
                  const newV   = n?.[key];
                  const isChg  = cf.includes(key);
                  const show   = n ? newV : oldV;
                  const fmtFn  = fmt || (v=>v);
                  return (
                    <div key={key}>
                      <div style={{ fontSize:10, color:isChg?"#f59e0b":"var(--text3)",
                        fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>
                        {label}{isChg?" ✎":""}
                      </div>
                      <div style={{ fontSize:12 }}>
                        {isChg ? (
                          <>
                            <span style={{textDecoration:"line-through",color:"var(--text3)",marginRight:5,fontSize:11}}>
                              {oldV ? fmtFn(oldV) : EMPTY}
                            </span>
                            <span style={{color:"#fbbf24",fontWeight:600}}>
                              {newV ? fmtFn(newV) : EMPTY}
                            </span>
                          </>
                        ) : (
                          <span style={{color:"var(--text2)"}}>
                            {show ? fmtFn(show) : EMPTY}
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

  // ── visible rows ─────────────────────────────────────────────────
  const { important, unchanged: unchangedRows } = React.useMemo(() => {
    if (!diff) return { important:[], unchanged:[] };
    const rows = activeTab === "all" ? diff.rows : diff.rows.filter(r=>r.type===activeTab);
    if (activeTab === "all") {
      return { important: rows.filter(r=>r.type!=="unchanged"), unchanged: rows.filter(r=>r.type==="unchanged") };
    }
    return { important: rows, unchanged: [] };
  }, [diff, activeTab]);

  // ── render ───────────────────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div className="modal"
           style={{ width:"min(940px,96vw)", maxHeight:"92vh", display:"flex",
                    flexDirection:"column", padding:"1.5rem" }}
           onClick={e=>e.stopPropagation()}>

        {/* UPLOAD */}
        {stage === "upload" && (
          <>
            <h3 style={{marginBottom:8}}>Import data</h3>
            <p style={{marginBottom:16,color:"var(--text2)",fontSize:13}}>
              {isFirstImport
                ? "Upload your Excel or CSV file to get started."
                : "Upload a file — a side-by-side diff shows exactly what will change."}
              {" "}<span style={{color:"var(--indigo)",cursor:"pointer",textDecoration:"underline"}}
                onClick={downloadTemplate}>Download template</span>
            </p>
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current.click()}
              style={{
                border:"2px dashed "+(dragging?"var(--indigo)":"var(--border2)"),
                borderRadius:12, padding:"2.5rem 2rem", textAlign:"center",
                cursor:"pointer", marginBottom:20, transition:"border-color 0.2s",
                background: dragging?"var(--indigo-bg)":"var(--surface2)",
              }}
            >
              <div style={{fontSize:32,marginBottom:8}}>📂</div>
              <div style={{fontSize:14,color:"var(--text)",fontWeight:500,marginBottom:4}}>
                Drop your file here or click to browse
              </div>
              <div style={{fontSize:12,color:"var(--text3)"}}>Supports .xlsx, .xls, and .csv</div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}}
                     onChange={e=>handleFile(e.target.files[0])}/>
            </div>
            {error && <div style={{fontSize:12,color:"var(--red)",marginBottom:16}}>{error}</div>}
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn-ghost" style={{fontSize:12}} onClick={downloadTemplate}>Download template</button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {/* DIFF PREVIEW */}
        {stage === "preview" && diff && (
          <>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h3 style={{margin:0}}>{isFirstImport?"Preview import":"Review changes"}</h3>
              <button onClick={onClose} style={{background:"none",border:"none",color:"var(--text3)",fontSize:18,cursor:"pointer"}}>✕</button>
            </div>

            {/* Filter tabs */}
            <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
              <TabPill id="all"       count={diff.rows.length} color="#6366f1" label="All"/>
              <TabPill id="added"     count={diff.added}       color="#10b981" label="New"/>
              <TabPill id="changed"   count={diff.changed}     color="#f59e0b" label="Changed"/>
              <TabPill id="deleted"   count={diff.deleted}     color="#ef4444" label="Removed"/>
              <TabPill id="unchanged" count={diff.unchanged}   color="#6b7280" label="Unchanged"/>
            </div>

            {diff.warnings.length > 0 && (
              <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",
                           borderRadius:8,padding:"8px 12px",marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:"var(--amber)"}}>
                  ⚠ {diff.warnings.length} row{diff.warnings.length!==1?"s":""} need review
                </div>
              </div>
            )}

            <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>
              Click any row to expand all fields · Changed fields highlighted in amber
            </div>

            {/* Table — fixed column grid */}
            <div style={{flex:1,overflowY:"auto",borderRadius:8,border:"1px solid var(--border)",marginBottom:12}}>
              <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
                <colgroup>
                  <col style={{width:"24px"}}/>
                  {COLS.map(c=><col key={"cL"+c.key} style={{width:c.w}}/>)}
                  {COLS.map(c=><col key={"cR"+c.key} style={{width:c.w}}/>)}
                </colgroup>
                <thead style={{position:"sticky",top:0,zIndex:10}}>
                  <tr>
                    <th style={{background:"var(--surface2)",borderBottom:"1px solid var(--border)"}}/>
                    <th colSpan={COLS.length} style={{
                      background:"rgba(99,102,241,0.1)",padding:"7px 10px",
                      fontSize:10,fontWeight:700,color:"var(--text2)",
                      letterSpacing:"0.08em",textTransform:"uppercase",textAlign:"left",
                      borderBottom:"1px solid var(--border)",borderRight:"2px solid var(--border2)"}}>
                      ← Existing (dashboard)
                    </th>
                    <th colSpan={COLS.length} style={{
                      background:"rgba(16,185,129,0.07)",padding:"7px 10px",
                      fontSize:10,fontWeight:700,color:"var(--text2)",
                      letterSpacing:"0.08em",textTransform:"uppercase",textAlign:"left",
                      borderBottom:"1px solid var(--border)"}}>
                      Incoming (file) →
                    </th>
                  </tr>
                  <tr style={{background:"var(--surface2)"}}>
                    <th style={{borderBottom:"1px solid var(--border)"}}/>
                    {COLS.map((c,i)=>(
                      <th key={"hL"+c.key} style={{padding:"6px 8px",fontSize:10,color:"var(--text3)",
                        textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--border)",
                        borderRight:i===COLS.length-1?"2px solid var(--border2)":"none"}}>
                        {c.label}
                      </th>
                    ))}
                    {COLS.map(c=>(
                      <th key={"hR"+c.key} style={{padding:"6px 8px",fontSize:10,color:"var(--text3)",
                        textAlign:"left",fontWeight:500,borderBottom:"1px solid var(--border)"}}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {important.map((row,i)=>(
                    <DiffRow key={i} row={row} rowIdx={i}/>
                  ))}

                  {unchangedRows.length > 0 && (
                    <>
                      <tr>
                        <td colSpan={COLS.length*2+1} style={{padding:"8px",textAlign:"center",
                          background:"rgba(255,255,255,0.02)",
                          borderTop:"1px solid var(--border)",borderBottom:"1px solid var(--border)"}}>
                          <button onClick={()=>setShowUnchanged(v=>!v)} style={{
                            background:"none",border:"1px solid var(--border2)",color:"var(--text3)",
                            fontSize:11,padding:"4px 14px",borderRadius:20,cursor:"pointer"}}>
                            {showUnchanged?"▲ Hide":"▼ Show"} {unchangedRows.length} unchanged rows
                          </button>
                        </td>
                      </tr>
                      {showUnchanged && unchangedRows.map((row,i)=>(
                        <DiffRow key={"u"+i} row={row} rowIdx={1000+i}/>
                      ))}
                    </>
                  )}

                  {important.length===0 && unchangedRows.length===0 && (
                    <tr><td colSpan={COLS.length*2+1} style={{padding:"24px",textAlign:"center",
                      color:"var(--text3)",fontSize:13}}>No rows to show</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Legend pills */}
            <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:11,color:"var(--text3)",marginRight:2}}>Legend:</span>
              <LegendPill color="#10b981" label="New row"/>
              <LegendPill color="#f59e0b" label="Changed"/>
              <LegendPill color="#ef4444" label="Removed"/>
              <LegendPill color="#6b7280" label="Unchanged"/>
            </div>

            {/* Actions */}
            <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
              <button className="btn-ghost" onClick={()=>{setStage("upload");setDiff(null);}}>Back</button>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {!isFirstImport && diff.added===0 && diff.changed===0 && (
                  <span style={{fontSize:12,color:"var(--text3)"}}>No new changes to apply</span>
                )}
                <button className="btn"
                  disabled={!isFirstImport && diff.added===0 && diff.changed===0}
                  onClick={handleConfirm}
                  style={{opacity:(!isFirstImport&&diff.added===0&&diff.changed===0)?0.4:1}}>
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
