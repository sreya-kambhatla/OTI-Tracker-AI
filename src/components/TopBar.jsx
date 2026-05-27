import React from 'react';
import { UploadIcon, DownloadIcon, SettingsIcon } from './Icons';

function TopBar({ onExport, onImport, onReset, onSettings }) {
  return (
    <div className="top-bar">
      <h1 style={{ fontSize:22 }}>Team OTI Dashboard</h1>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <button className="btn-ghost" onClick={onImport}
          style={{ display:"flex", alignItems:"center", gap:6 }}>
          <UploadIcon /> Import CSV
        </button>
        <button className="btn-green" onClick={onExport}
          style={{ display:"flex", alignItems:"center", gap:6 }}>
          <DownloadIcon /> Export CSV
        </button>
        <button className="btn-danger" onClick={onReset}>Reset data</button>
        <button className="btn-ghost" onClick={onSettings} title="Settings"
          style={{ padding:"7px 12px" }}>
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
}

export default TopBar;
