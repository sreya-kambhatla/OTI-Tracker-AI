import React from 'react';

function SettingsModal({ onClose }) {
  const [keyExists, setKeyExists] = React.useState(() => !!localStorage.getItem("oti-ai-key"));
  const [replacing, setReplacing] = React.useState(() => !localStorage.getItem("oti-ai-key"));
  const [newKey,    setNewKey]    = React.useState("");
  const [saved,     setSaved]     = React.useState(false);

  function handleSave() {
    if (!newKey.trim()) return;
    localStorage.setItem("oti-ai-key", newKey.trim());
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  function handleClear() {
    localStorage.removeItem("oti-ai-key");
    setKeyExists(false);
    setReplacing(true);
    setNewKey("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 8 }}>⚙ Settings</h3>
        <p style={{ marginBottom: 24 }}>
          Configure your Anthropic API key to enable the AI natural language filtering feature.
          Your key is stored locally in your browser and never sent to any third party.
        </p>

        <label className="form-label">Anthropic API Key</label>

        {keyExists && !replacing ? (
          <div style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
            <div style={{
              flex:1, padding:"8px 11px", fontSize:13,
              background:"var(--surface2)", border:"1px solid var(--border)",
              borderRadius:8, color:"var(--text3)", letterSpacing:"0.15em"
            }}>
              sk-ant-••••••••••••••••••••••••
            </div>
            <button
              className="btn-ghost"
              style={{ fontSize:12, flexShrink:0 }}
              onClick={() => { setReplacing(true); setNewKey(""); }}
            >
              Replace
            </button>
          </div>
        ) : (
          <div style={{ marginBottom:8 }}>
            <input
              type="password"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="sk-ant-..."
              autoFocus
            />
          </div>
        )}

        <p style={{ fontSize:11, color:"var(--text3)", marginBottom:24 }}>
          Get your API key at{" "}
          <span style={{ color:"var(--indigo)" }}>console.anthropic.com</span>
          {" "}→ API Keys → Create Key
        </p>

        {saved && (
          <div style={{ fontSize:12, color:"var(--green)", marginBottom:12 }}>
            ✓ API key saved — AI filtering is now active
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"space-between" }}>
          <button className="btn-danger" onClick={handleClear} disabled={!keyExists}>
            Clear key
          </button>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            {replacing
              ? <button className="btn" onClick={handleSave} disabled={!newKey.trim()}>Save</button>
              : <button className="btn-ghost" onClick={onClose}>Done</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
