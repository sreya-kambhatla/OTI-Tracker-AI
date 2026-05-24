import React from 'react';
import * as XLSX from 'xlsx';
import { parseCSV, parseExcelJSON, downloadTemplate, statusStyle } from '../utils';

function ImportModal({ onImport, existingLogs = [], onClose }) {
  const [stage,    setStage]   = React.useState("upload");
  const [diff,     setDiff]    = React.useState(null);
  const [error,    setError]   = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef();

  function computeDiff(incoming) {
    const existingMap = {};
    existingLogs.forEach(l => {
      existingMap[`${l.otiId}|${l.date}|${l.assignee}`] = l;
    });

    const added    = [];
    const changed  = [];
    const unchanged = [];
    const warnings = [];

    incoming.logs.forEach(row => {
      const key = `${row.otiId}|${row.date}|${row.assignee}`;
      const existing = existingMap[key];
      if (!existing) {
        added.push(row);
      } else {
        const hasChange =
          String(existing.hours)   !== String(row.hours)   ||
          existing.status          !== row.status          ||
          existing.priority        !== row.priority        ||
          (existing.notes || "")   !== (row.notes || "")   ||
          existing.title           !== row.title;
        if (hasChange) {
          changed.push({ old: existing, new: row });
        } else {
          unchanged.push(row);
        }
      }
    });

    return { added, changed, unchanged, warnings: incoming.errors };
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
    const toAdd    = diff.added;
    const toUpdate = diff.changed.map(c => c.new);
    onImport([...toAdd, ...toUpdate], "merge");
    onClose();
  }

  const isFirstImport = existingLogs.length === 0;

  // ── row styling ──────────────────────────────────────────────────
  const rowStyle = (type) => ({
    background: type === "added"   ? "rgba(16,185,129,0.08)"  :
                type === "changed" ? "rgba(245,158,11,0.08)"  :
                                     "rgba(255,255,255,0.02)",
  });
  const tagStyle = (type) => ({
    fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:10,
    background: type === "added"   ? "rgba(16,185,129,0.18)"  :
                type === "changed" ? "rgba(245,158,11,0.18)"  :
                                     "rgba(255,255,255,0.06)",
    color:      type === "added"   ? "var(--green)"  :
                type === "changed" ? "var(--amber)"  : "var(--text3)",
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width:640, maxWidth:"92vw", maxHeight:"85vh", display:"flex", flexDirection:"column", overflow:"hidden" }}
           onClick={e => e.stopPropagation()}>

        {/* ── UPLOAD STAGE ── */}
        {stage === "upload" && (
          <>
            <h3 style={{ marginBottom:8 }}>Import data</h3>
            <p style={{ marginBottom:16, color:"var(--text2)", fontSize:13 }}>
              {isFirstImport
                ? "Upload your Excel or CSV file to get started."
                : "Upload a new file — existing entries will be compared and only changes will be applied."}
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

        {/* ── PREVIEW STAGE ── */}
        {stage === "preview" && diff && (
          <>
            <h3 style={{ marginBottom:12 }}>
              {isFirstImport ? "Preview import" : "Review changes"}
            </h3>

            {/* Summary banner */}
            <div style={{
              display:"flex", gap:10, marginBottom:16, flexWrap:"wrap",
            }}>
              {isFirstImport ? (
                <div style={{ ...tagStyle("added"), padding:"6px 14px", fontSize:12 }}>
                  ✓ {diff.added.length} rows ready to import
                </div>
              ) : (
                <>
                  <div style={{ ...tagStyle("added"), padding:"6px 14px", fontSize:12 }}>
                    ✚ {diff.added.length} new
                  </div>
                  <div style={{ ...tagStyle("changed"), padding:"6px 14px", fontSize:12 }}>
                    ✎ {diff.changed.length} changed
                  </div>
                  <div style={{ ...tagStyle("unchanged"), padding:"6px 14px", fontSize:12 }}>
                    ◎ {diff.unchanged.length} unchanged
                  </div>
                </>
              )}
            </div>

            {/* Warnings */}
            {diff.warnings.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)",
                            borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--amber)", marginBottom:4 }}>
                  ⚠ {diff.warnings.length} row{diff.warnings.length !== 1 ? "s" : ""} need review
                </div>
                <div style={{ maxHeight:80, overflowY:"auto" }}>
                  {diff.warnings.map((w,i) => (
                    <div key={i} style={{ fontSize:11, color:"var(--amber)", padding:"1px 0" }}>{w}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Diff table */}
            <div style={{ flex:1, overflowY:"auto", borderRadius:8, border:"1px solid var(--border)", marginBottom:16 }}>
              <table style={{ minWidth: isFirstImport ? 480 : 620, width:"100%" }}>
                <thead>
                  <tr>
                    {!isFirstImport && <th style={{ width:72 }}>Status</th>}
                    <th>OTI ID</th>
                    <th>Title</th>
                    <th>Assignee</th>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isFirstImport ? (
                    // First import — show all rows simply
                    diff.added.map((log, i) => (
                      <tr key={i}>
                        <td style={{ color:"var(--indigo)", fontWeight:600 }}>{log.otiId}</td>
                        <td style={{ maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.title}</td>
                        <td>{log.assignee}</td>
                        <td>{log.date}</td>
                        <td style={{ fontWeight:600 }}>{log.hours}h</td>
                        <td><span className="badge" style={statusStyle(log.status)}>{log.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <>
                      {/* New rows */}
                      {diff.added.map((log, i) => (
                        <tr key={"a"+i} style={rowStyle("added")}>
                          <td><span style={tagStyle("added")}>NEW</span></td>
                          <td style={{ color:"var(--indigo)", fontWeight:600 }}>{log.otiId}</td>
                          <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.title}</td>
                          <td>{log.assignee}</td>
                          <td>{log.date}</td>
                          <td style={{ color:"var(--green)", fontWeight:600 }}>{log.hours}h</td>
                          <td><span className="badge" style={statusStyle(log.status)}>{log.status}</span></td>
                        </tr>
                      ))}
                      {/* Changed rows — show what's changing */}
                      {diff.changed.map((c, i) => (
                        <tr key={"c"+i} style={rowStyle("changed")}>
                          <td><span style={tagStyle("changed")}>CHANGED</span></td>
                          <td style={{ color:"var(--indigo)", fontWeight:600 }}>{c.new.otiId}</td>
                          <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.new.title}</td>
                          <td>{c.new.assignee}</td>
                          <td>{c.new.date}</td>
                          <td>
                            {c.old.hours !== c.new.hours ? (
                              <span>
                                <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:4 }}>{c.old.hours}h</span>
                                <span style={{ color:"var(--amber)", fontWeight:600 }}>{c.new.hours}h</span>
                              </span>
                            ) : <span>{c.new.hours}h</span>}
                          </td>
                          <td>
                            {c.old.status !== c.new.status ? (
                              <span>
                                <span style={{ textDecoration:"line-through", color:"var(--text3)", marginRight:4, fontSize:11 }}>{c.old.status}</span>
                                <span className="badge" style={statusStyle(c.new.status)}>{c.new.status}</span>
                              </span>
                            ) : <span className="badge" style={statusStyle(c.new.status)}>{c.new.status}</span>}
                          </td>
                        </tr>
                      ))}
                      {/* Unchanged rows */}
                      {diff.unchanged.slice(0, 3).map((log, i) => (
                        <tr key={"u"+i} style={rowStyle("unchanged")}>
                          <td><span style={tagStyle("unchanged")}>SKIP</span></td>
                          <td style={{ color:"var(--text3)" }}>{log.otiId}</td>
                          <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--text3)" }}>{log.title}</td>
                          <td style={{ color:"var(--text3)" }}>{log.assignee}</td>
                          <td style={{ color:"var(--text3)" }}>{log.date}</td>
                          <td style={{ color:"var(--text3)" }}>{log.hours}h</td>
                          <td style={{ color:"var(--text3)" }}>{log.status}</td>
                        </tr>
                      ))}
                      {diff.unchanged.length > 3 && (
                        <tr style={rowStyle("unchanged")}>
                          <td colSpan={7} style={{ textAlign:"center", color:"var(--text3)", fontSize:12, padding:"8px" }}>
                            +{diff.unchanged.length - 3} more unchanged rows — will be skipped
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <button className="btn-ghost" onClick={() => { setStage("upload"); setDiff(null); }}>Back</button>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                {!isFirstImport && diff.added.length === 0 && diff.changed.length === 0 && (
                  <span style={{ fontSize:12, color:"var(--text3)" }}>No new changes to apply</span>
                )}
                <button
                  className="btn"
                  disabled={!isFirstImport && diff.added.length === 0 && diff.changed.length === 0}
                  onClick={handleConfirm}
                  style={{ opacity: (!isFirstImport && diff.added.length === 0 && diff.changed.length === 0) ? 0.4 : 1 }}
                >
                  {isFirstImport
                    ? `Import ${diff.added.length} rows`
                    : `Apply ${diff.added.length + diff.changed.length} change${diff.added.length + diff.changed.length !== 1 ? "s" : ""}`}
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
