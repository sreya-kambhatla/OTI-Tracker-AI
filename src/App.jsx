import React from 'react';
import { EMPTY_FILTERS } from './constants';
import { groupByOTI, sumHours, applyFilters, loadFromStorage, saveToStorage, exportToCSV } from './utils';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Filters from './components/Filters';
import AddEntryForm from './components/AddEntryForm';
import OTICard from './components/OTICard';
import WeeklyView from './components/WeeklyView';
import WorkloadView from './components/WorkloadView';
import ImportModal from './components/ImportModal';
import Toast from './components/Toast';
import AIQuery from './components/AIQuery';
import SettingsModal from './components/SettingsModal';

function App() {
  const [logs,    setLogs]    = React.useState(() => loadFromStorage() || []);
  const [filters, setFilters] = React.useState(EMPTY_FILTERS);
  const [toast,   setToast]   = React.useState(null);
  const [tab,     setTab]     = React.useState("otis");
  const [sortBy,  setSortBy]  = React.useState("recent");
  const [showImport,   setShowImport]   = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);

  React.useEffect(() => { saveToStorage(logs); }, [logs]);

  const filteredLogs = React.useMemo(() => applyFilters(logs, filters), [logs, filters]);
  const grouped      = React.useMemo(() => groupByOTI(filteredLogs), [filteredLogs]);
  const isFiltered   = Object.values(filters).some(Boolean);

  const sortedOTIs = React.useMemo(() => {
    const entries = Object.entries(grouped);
    switch (sortBy) {
      case "id-asc":     return entries.slice().sort((a,b) => a[0].localeCompare(b[0]));
      case "id-desc":    return entries.slice().sort((a,b) => b[0].localeCompare(a[0]));
      case "hours-desc": return entries.slice().sort((a,b) => sumHours(b[1]) - sumHours(a[1]));
      case "hours-asc":  return entries.slice().sort((a,b) => sumHours(a[1]) - sumHours(b[1]));
      case "recent":     return entries.slice().sort((a,b) => {
        const la = a[1].slice().sort((x,y) => y.date.localeCompare(x.date))[0].date;
        const lb = b[1].slice().sort((x,y) => y.date.localeCompare(x.date))[0].date;
        return lb.localeCompare(la);
      });
      default: return entries;
    }
  }, [grouped, sortBy]);

  function handleAdd(newLog)              { setLogs(p => [...p, newLog]); setToast(`Log added for ${newLog.otiId}`); }
  function handleImport(importedLogs)     { setLogs(importedLogs); setToast(`Imported ${importedLogs.length} entries successfully`); }
  function handleDelete(id)               { setLogs(p => p.filter(l => l.id !== id)); setToast("Entry deleted"); }
  function handleEdit(updated)            { setLogs(p => p.map(l => l.id === updated.id ? updated : l)); setToast("Entry updated"); }
  function handleStatusChange(otiId, s)   { setLogs(p => p.map(l => l.otiId === otiId ? {...l, status:s} : l)); setToast(`${otiId} marked as ${s}`); }
  function handleResetData()              {
    if (confirm("Reset all data? This cannot be undone.")) { setLogs([]); setToast("Data cleared"); }
  }

  return (
    <div>
      <TopBar
        onImport={() => setShowImport(true)}
        onExport={() => exportToCSV(filteredLogs)}
        onReset={handleResetData}
        onSettings={() => setShowSettings(true)}
      />

      <div className="page-body">
        <div className="page-static">
          <Dashboard logs={filteredLogs} />

          <AIQuery onApplyFilters={filters => setFilters(filters)} allLogs={logs} />

          <div className="tab-bar">
            {[
              { id:"otis",     label:"OTIs" },
              { id:"weekly",   label:"Weekly summary" },
              { id:"workload", label:"Assignee workload" },
            ].map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === "otis" && (
            <div>
              <Filters filters={filters} onChange={(k,v) => setFilters(p => ({...p,[k]:v}))} onClear={() => setFilters(EMPTY_FILTERS)} allLogs={logs} />
              <AddEntryForm onAdd={handleAdd} allLogs={logs} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"8px 0 4px" }}>
                <div style={{ fontSize:12, color:"var(--text3)" }}>{Object.keys(grouped).length} OTIs</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <label className="form-label" style={{ marginBottom:0, whiteSpace:"nowrap" }}>Sort by</label>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ maxWidth:180, padding:"5px 10px", fontSize:12 }}>
                    <option value="recent">Last logged</option>
                    <option value="hours-desc">Most hours</option>
                    <option value="hours-asc">Least hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="page-scroll">
          {tab === "otis" && (
            <div style={{ marginTop:8 }}>
              {sortedOTIs.length === 0 ? (
                <div className="card empty">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-text">No OTIs match your current filters</div>
                </div>
              ) : (
                sortedOTIs.map(([otiId, entries]) => (
                  <OTICard key={otiId} otiId={otiId} entries={entries}
                    onDelete={handleDelete} onEdit={handleEdit} onStatusChange={handleStatusChange} />
                ))
              )}
            </div>
          )}

          {tab === "weekly"   && <WeeklyView   logs={filteredLogs} />}
          {tab === "workload" && <WorkloadView logs={filteredLogs} />}
        </div>
      </div>

      {showImport   && <ImportModal  onImport={handleImport} onClose={() => setShowImport(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

export default App;
