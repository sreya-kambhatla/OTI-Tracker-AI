import React from 'react';

function TopBar({ onExport, onImport, onReset, onSettings }) {
  return (
    <div className="top-bar">
      <h1>Team OTI Dashboard</h1>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <button className="btn-ghost" onClick={onImport}>↑ Import CSV</button>
        <button className="btn-green"  onClick={onExport}>↓ Export CSV</button>
        <button className="btn-danger" onClick={onReset}>Reset data</button>
        <button
          className="btn-ghost"
          onClick={onSettings}
          title="Settings"
          style={{ fontSize:16, padding:"7px 12px" }}
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

export default TopBar;
