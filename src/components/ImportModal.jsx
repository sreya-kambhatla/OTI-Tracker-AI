import React from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, parseExcelJSON, downloadTemplate, statusStyle } from '../utils';

function ImportModal({ onImport, existingLogs = [], onClose }) {
  const [stage,    setStage]    = React.useState("upload");
  const [diff,     setDiff]     = React.useState(null);
  const [error,    setError]    = React.useState("");
  const [dragging, setDragging] = React.useState(false);
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

    // Added + Changed + Unchanged (from incoming perspective)
    incoming.logs.forEach(row => {
      const key = `${row.otiId}|${row.date}|${row.assignee}`;
      const existing = existingMap[key];
      if (!existing) {
        rows.push({ type: "added", old: null, new: row });
      } else {
        const changedFields = [];
        if (String(existing.hours)  !== String(row.hours))  changedFields.push("hours");
        if (existing.status         !== row.status)         changedFields.push("status");
        if (existing.priority       !== row.priority)       changedFields.push("priority");
        if ((existing.notes||"")    !== (row.notes||""))    changedFields.push("notes");
        if (existing.title          !== row.title)          changedFields.push("title");
        if (changedFields.length > 0) {
          rows.push({ type: "changed", old: existing, new: row, changedFields });
        } else {
          rows.push({ type: "unchanged", old: existing, new: row, changedFields: [] });
        }
      }
    });

    // Deleted (in existing but not in incoming)
    existingLogs.forEach(l => {
      const key = `${l.otiId}|${l.date}|${l.assignee}`;
      if (!incomingMap[key]) {
        rows.push({ type: "deleted", old: l, new: null });
      }
    });

    // Sort: changed first, then added, then deleted, then unchanged
    const order = { changed:0, added:1, deleted:2, unchanged:3 };
    rows.sort((a,b) => order[a.type] - order[b.type]);

    const added    = rows.filter(r => r.type === "added").length;
    const changed  = rows.filter(r => r.type === "changed").length;
    const deleted  = rows.filter(r => r.type === "deleted").length;
    const unchanged= rows.filter(r => r.type === "unchanged").length;

    return { rows, added, changed, deleted, unchanged, warnings: incoming.errors };
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
          setStage("preview");
          setError("");
        } catch(diffErr) {
          setError("Error processing file: " + diffErr.message);
        }
      } catch(err) {
        setError("Could not read file: " + err.message);
      }
    };
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleConfirm() {
    const toAdd    = diff.rows.filter(r => r.type === "added").map(r => r.new);
    const toUpdate = diff.rows.filter(r => r.type === "changed").map(r => r.new);
    onImport([...toAdd, ...toUpdate], "merge");
    onClose();
  }

  const isFirstImport = existingLogs.length === 0;

  // ── cell helpers ─────────────────────────────────────────────────
  function Cell({ val, oldVal, changed, style = {} }) {
    if (changed && oldVal !== undefined && String(oldVal) !== String(val)) {
      return (
        <td style={style}>
          <span style={{ textDecoration:"line-through", color:"rgba(255,255,255,0.25)", marginRight:5, fontSize:11 }}>
            {oldVal}{typeof oldVal === "number" || !isNaN(oldVal) ? "h" : ""}
          </span>
          <span style={{ color:"#fbbf24", fontWeight:600 }}>
            {val}{typeof val === "number" || !isNaN(val) ? "h" : ""}
          </span>
        </td>
      );
    }
    return <td style={style}>{val}{(style.isHours && val !== "—") ? "h" : ""}</td>;
  }

  const rowBg = (type) =>
    type === "added"    ? "rgba(16,185,129,0.07)"  :
    type === "changed"  ? "rgba(245,158,11,0.07)"  :
    type === "deleted"  ? "rgba(239,68,68,0.07)"   :
                          "transparent";

  const rowBorder = (type) =>
    type === "added"    ? "2px solid rgba(16,185,129,0.3)"  :
    type === "changed"  ? "2px solid rgba(245,158,11,0.3)"  :
    type === "deleted"  ? "2px solid rgba(239,68,68,0.3)"   :
                          "2px solid transparent";

  const typeTag = (type) => {
    const styles = {
      added:     { bg:"rgba(16,185,129,0.18)",  color:"#10b981", label:"NEW"     },
      changed:   { bg:"rgba(245,158,11,0.18)",  color:"#f59e0b", label:"CHANGED" },
      deleted:   { bg:"rgba(239,68,68,0.18)",   color:"#ef4444", label:"REMOVED" },
      unchanged: { bg:"rgba(255,255,255,0.06)", color:"#6b7280", label:"SAME"    },
    };
    const s = styles[type];
    return (
      <span style={{ fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:8,
        background:s.bg, color:s.color, letterSpacing:"0.05em" }}>
        {s.label}
      </span>
    );
  };

  const EMPTY = "—";

  return (
    <div className="modal-overlay">
      <div className="modal"
           style={{ width:"min(900px, 96vw)", maxHeight:"90vh", display:"flex",
                    flexDirection:"column", padding:"1.5rem" }}
           onClick={e => e.stopPropagation()}>

        {/* ── UPLOAD STAGE ── */}
        {stage === "upload" && (
          <>
            <h3 style={{ marginBottom:8 }}>Import data</h3>
            <p style={{ marginBottom:16, color:"var(--text2)", fontSize:13 }}>
              {isFirstImport
                ? "Upload your Excel or CSV file to get started."
                : "Upload a new file — a side-by-side diff will show exactly what will change."}
              {" "}<span style={{ color:"var(--indigo)", cursor:"pointer", textDecoration:"underline" }}
                onClick={downloadTemplate}>Download template</span>
            </p>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border:"2px dashed " + (dragging ? "var(--indigo)" : "var(--border2)"),
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

        {/* ── DIFF PREVIEW STAGE ── */}
        {stage === "preview" && diff && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h3 style={{ margin:0 }}>{isFirstImport ? "Preview import" : "Review changes"}</h3>
              <div style={{ display:"flex", gap:8 }}>
                {diff.added > 0    && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:10, background:"rgba(16,185,129,0.15)", color:"#10b981" }}>✚ {diff.added} new</span>}
                {diff.changed > 0  && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:10, background:"rgba(245,158,11,0.15)", color:"#f59e0b" }}>✎ {diff.changed} changed</span>}
                {diff.deleted > 0  && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:10, background:"rgba(239,68,68,0.15)", color:"#ef4444" }}>✕ {diff.deleted} removed</span>}
                {diff.unchanged > 0 && <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:10, background:"rgba(255,255,255,0.06)", color:"var(--text3)" }}>◎ {diff.unchanged} unchanged</span>}
              </div>
            </div>

            {/* Warnings */}
            {diff.warnings.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
                            borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--amber)", marginBottom:3 }}>
                  ⚠ {diff.warnings.length} row{diff.warnings.length !== 1 ? "s" : ""} need review
                </div>
                <div style={{ maxHeight:60, overflowY:"auto" }}>
                  {diff.warnings.map((w,i) => <div key={i} style={{ fontSize:11, color:"var(--amber)" }}>{w}</div>)}
                </div>
              </div>
            )}

            {/* Side-by-side diff table */}
            <div style={{ flex:1, overflowY:"auto", borderRadius:8, border:"1px solid var(--border)", marginBottom:14 }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr>
                    <th style={{ width:70, background:"var(--surface2)", borderBottom:"1px solid var(--border)", padding:"8px 6px" }}></th>
                    {/* Left — existing */}
                    <th colSpan={4} style={{ background:"rgba(99,102,241,0.08)", borderBottom:"1px solid var(--border)",
                      borderRight:"2px solid var(--border2)", padding:"8px 10px", color:"var(--text2)",
                      fontSize:11, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                      Existing (dashboard)
                    </th>
                    {/* Right — incoming */}
                    <th colSpan={4} style={{ background:"rgba(16,185,129,0.05)", borderBottom:"1px solid var(--border)",
                      padding:"8px 10px", color:"var(--text2)",
                      fontSize:11, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>
                      Incoming (file)
                    </th>
                  </tr>
                  <tr style={{ background:"var(--surface2)" }}>
                    <th style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)", fontSize:10, color:"var(--text3)" }}></th>
                    {["OTI ID","Date","Hours","Status"].map(h => (
                      <th key={"l"+h} style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)",
                        fontSize:10, color:"var(--text3)", textAlign:"left",
                        borderRight: h === "Status" ? "2px solid var(--border2)" : "none" }}>{h}</th>
                    ))}
                    {["OTI ID","Date","Hours","Status"].map(h => (
                      <th key={"r"+h} style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)",
                        fontSize:10, color:"var(--text3)", textAlign:"left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {diff.rows.map((row, i) => {
                    const o = row.old;
                    const n = row.new;
                    const cf = row.changedFields || [];
                    return (
                      <tr key={i} style={{
                        background: rowBg(row.type),
                        borderLeft: rowBorder(row.type),
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        {/* Tag */}
                        <td style={{ padding:"7px 8px", whiteSpace:"nowrap" }}>
                          {typeTag(row.type)}
                        </td>
                        {/* Left side — existing */}
                        <td style={{ padding:"7px 8px", color: o ? "var(--indigo)" : "var(--text3)",
                          fontWeight: o ? 600 : 400 }}>
                          {o ? o.otiId : EMPTY}
                        </td>
                        <td style={{ padding:"7px 8px", color: o ? "var(--text2)" : "var(--text3)" }}>
                          {o ? o.date : EMPTY}
                        </td>
                        <td style={{ padding:"7px 8px", color: o ? "var(--text)" : "var(--text3)",
                          fontWeight: o ? 500 : 400 }}>
                          {o ? `${o.hours}h` : EMPTY}
                        </td>
                        <td style={{ padding:"7px 8px", borderRight:"2px solid var(--border2)" }}>
                          {o ? <span className="badge" style={statusStyle(o.status)}>{o.status}</span> : <span style={{ color:"var(--text3)" }}>{EMPTY}</span>}
                        </td>
                        {/* Right side — incoming */}
                        <td style={{ padding:"7px 8px", color: n ? "var(--indigo)" : "var(--text3)",
                          fontWeight: n ? 600 : 400 }}>
                          {n ? n.otiId : EMPTY}
                        </td>
                        <td style={{ padding:"7px 8px", color: n ? "var(--text2)" : "var(--text3)" }}>
                          {n ? n.date : EMPTY}
                        </td>
                        <td style={{ padding:"7px 8px" }}>
                          {n ? (
                            cf.includes("hours") ? (
                              <span>
                                <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:4, fontSize:11 }}>{o.hours}h</span>
                                <span style={{ color:"#fbbf24", fontWeight:600 }}>{n.hours}h</span>
                              </span>
                            ) : <span style={{ color:"var(--text)", fontWeight:500 }}>{n.hours}h</span>
                          ) : <span style={{ color:"var(--text3)" }}>{EMPTY}</span>}
                        </td>
                        <td style={{ padding:"7px 8px" }}>
                          {n ? (
                            cf.includes("status") ? (
                              <span>
                                <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:4, fontSize:11 }}>{o.status}</span>
                                <span className="badge" style={statusStyle(n.status)}>{n.status}</span>
                              </span>
                            ) : <span className="badge" style={statusStyle(n.status)}>{n.status}</span>
                          ) : <span style={{ color:"var(--text3)" }}>{EMPTY}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, marginBottom:14, fontSize:11, color:"var(--text3)" }}>
              <span><span style={{ color:"#10b981" }}>■</span> New row</span>
              <span><span style={{ color:"#f59e0b" }}>■</span> Changed — strikethrough shows old value</span>
              <span><span style={{ color:"#ef4444" }}>■</span> Removed from file</span>
              <span><span style={{ color:"#6b7280" }}>■</span> Unchanged</span>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <button className="btn-ghost" onClick={() => { setStage("upload"); setDiff(null); }}>Back</button>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                {!isFirstImport && diff.added === 0 && diff.changed === 0 && (
                  <span style={{ fontSize:12, color:"var(--text3)" }}>No new changes to apply</span>
                )}
                <button
                  className="btn"
                  disabled={!isFirstImport && diff.added === 0 && diff.changed === 0}
                  onClick={handleConfirm}
                  style={{ opacity:(!isFirstImport && diff.added === 0 && diff.changed === 0) ? 0.4 : 1 }}
                >
                  {isFirstImport
                    ? `Import ${diff.added} rows`
                    : `Apply ${diff.added + diff.changed} change${diff.added + diff.changed !== 1 ? "s" : ""}`}
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
