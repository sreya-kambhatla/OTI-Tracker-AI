import React from 'react';

function TopBar({ onExport, onImport, onReset }) {
  return (
    <div className="top-bar">
      <h1 style={{ fontSize: 22 }}>Team OTI Dashboard</h1>
      <div style={{ display:"flex", gap:10 }}>
        <button className="btn-ghost" onClick={onImport}>↑ Import CSV</button>
        <button className="btn-green"  onClick={onExport}>↓ Export CSV</button>
        <button className="btn-danger" onClick={onReset}>Reset data</button>
      </div>
    </div>
  );
}

export default TopBar;
