import React from 'react';
import * as XLSX from 'xlsx';
import { calcHours, sumHours, groupByOTI, groupByAssignee, groupByWeek, getWeekLabel, statusStyle, priorityStyle, isCritical, applyFilters, loadFromStorage, saveToStorage, exportToCSV, parseCSV, parseExcelJSON, downloadTemplate } from '../utils';

function ImportModal({ onImport, onClose }) {
  const [stage,    setStage]    = React.useState("upload");
  const [preview,  setPreview]  = React.useState(null);
  const [error,    setError]    = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef();

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
          const wb   = XLSX.read(e.target.result, { type: "array", cellDates: false });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
          result     = parseExcelJSON(json);
        } else {
          result = parseCSV(e.target.result);
        }
        if (result.error) { setError(result.error); return; }
        setPreview(result);
        setStage("preview");
        setError("");
      } catch(err) {
        setError("Could not read file: " + err.message);
      }
    };
    isExcel ? reader.readAsArrayBuffer(file) : reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width:560 }} onClick={e => e.stopPropagation()}>

        {stage === "upload" && (
          <>
            <h3>Import from CSV</h3>
            <p>Upload your Excel or CSV file. Columns are matched automatically.{" "}
              <span style={{ color:"var(--indigo)", cursor:"pointer", textDecoration:"underline" }} onClick={downloadTemplate}>Download template</span>
            </p>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border: "2px dashed " + (dragging ? "var(--indigo)" : "var(--border2)"),
                borderRadius:12, padding:"2.5rem 2rem", textAlign:"center",
                cursor:"pointer", marginBottom:20, transition:"border-color 0.2s",
                background: dragging ? "var(--indigo-bg)" : "var(--surface2)",
              }}
            >
              <div style={{ fontSize:32, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:14, color:"var(--text)", fontWeight:500, marginBottom:4 }}>Drop your CSV here or click to browse</div>
              <div style={{ fontSize:12, color:"var(--text3)" }}>Supports .xlsx, .xls, and .csv files</div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            {error && <div style={{ fontSize:12, color:"var(--red)", marginBottom:16 }}>{error}</div>}
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <button className="btn-ghost" style={{ fontSize:12 }} onClick={downloadTemplate}>Download template</button>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}

        {stage === "preview" && preview && (
          <>
            <h3>Preview import</h3>
            <p>
              Found <strong style={{ color:"var(--text)" }}>{preview.logs.length} rows</strong> ready to import.
              {preview.errors.length > 0 && (
                <span style={{ color:"var(--amber)" }}> {preview.errors.length} row{preview.errors.length !== 1 ? "s" : ""} have warnings — all will still import.</span>
              )}
              {" "}This will replace all existing data.
            </p>
            {preview.errors.length > 0 && (
              <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:8, padding:"12px 14px", marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"var(--amber)", marginBottom:6 }}>
                  ⚠ {preview.errors.length} row{preview.errors.length !== 1 ? "s" : ""} need review — fix in your file and re-import to avoid data issues
                </div>
                <div style={{ maxHeight:120, overflowY:"auto" }}>
                  {preview.errors.map((e,i) => (
                    <div key={i} style={{ fontSize:11, color:"var(--amber)", padding:"2px 0", borderTop: i > 0 ? "1px solid rgba(245,158,11,0.15)" : "none" }}>{e}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ overflowX:"auto", marginBottom:20, borderRadius:8, border:"1px solid var(--border)" }}>
              <table style={{ minWidth:480 }}>
                <thead>
                  <tr>{["OTI ID","Title","Assignee","Date","Hours","Status"].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.logs.slice(0,5).map((log,i) => (
                    <tr key={i}>
                      <td style={{ color:"var(--indigo)", fontWeight:600 }}>{log.otiId}</td>
                      <td style={{ maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{log.title}</td>
                      <td>{log.assignee}</td>
                      <td>{log.date}</td>
                      <td style={{ color:"var(--text)", fontWeight:600 }}>{log.hours}h</td>
                      <td><span className="badge" style={statusStyle(log.status)}>{log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.logs.length > 5 && (
                <div style={{ textAlign:"center", padding:"8px", fontSize:12, color:"var(--text3)", borderTop:"1px solid var(--border)" }}>
                  +{preview.logs.length - 5} more rows
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn-ghost" onClick={() => { setStage("upload"); setPreview(null); }}>Back</button>
              <button className="btn" onClick={() => { onImport(preview.logs); onClose(); }}>Import {preview.logs.length} rows</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
