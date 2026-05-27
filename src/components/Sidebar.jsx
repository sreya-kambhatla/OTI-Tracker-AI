import React from 'react';
import { AnalyticsIcon, ListIcon, CalendarIcon, ChartIcon, UploadIcon, DownloadIcon, SettingsIcon, ResetIcon } from './Icons';

const NAV_ITEMS = [
  { id:"analytics", label:"Analytics",      Icon: AnalyticsIcon },
  { id:"otis",      label:"OTIs",           Icon: ListIcon },
  { id:"weekly",    label:"Weekly summary", Icon: CalendarIcon },
  { id:"workload",  label:"Workload",       Icon: ChartIcon },
];

function Sidebar({ tab, onTabChange, onImport, onExport, onSettings, onReset }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 7L7 13L1 7L7 1Z" fill="white" fillOpacity="0.95"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-brand-title">OTI Tracker</div>
          <div className="sidebar-brand-sub">Team Dashboard</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={"nav-item" + (tab === id ? " nav-active" : "")}
            onClick={() => onTabChange(id)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-section-label">Actions</div>
        <button className="nav-item" onClick={onImport}><UploadIcon size={15} /> Import CSV</button>
        <button className="nav-item" onClick={onExport}><DownloadIcon size={15} /> Export CSV</button>
        <button className="nav-item" onClick={onSettings}><SettingsIcon size={15} /> Settings</button>
        <button className="nav-item nav-danger" onClick={onReset}><ResetIcon size={15} /> Reset data</button>
      </div>
    </aside>
  );
}

export default Sidebar;
