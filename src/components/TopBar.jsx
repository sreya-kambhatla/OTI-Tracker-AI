import React from 'react';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function TopBar({ onExport, onImport, onReset, onSettings, theme, onToggleTheme }) {
  return (
    <div className="top-bar">
      <h1 style={{ fontSize: 22 }}>Team OTI Dashboard</h1>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        <button
          className="btn-ghost"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px" }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          {theme === "dark" ? "Light" : "Dark"}
        </button>
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
