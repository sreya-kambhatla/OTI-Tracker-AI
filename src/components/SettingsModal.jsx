import React from 'react';

function SettingsModal({ onClose }) {
  const hasKey = !!localStorage.getItem("oti-ai-key");
  const [key,   setKey]   = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);

  function handleSave() {
    if (key.trim()) {
      localStorage.setItem("oti-ai-key", key.trim());
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  function handleRemove() {
    localStorage.removeItem("oti-ai-key");
    setKey("");
    setRemoving(true);
    setTimeout(() => { setRemoving(false); onClose(); }, 1000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 8 }}>Settings</h3>
        <p style={{ marginBottom: 20 }}>
          Configure your Anthropic API key to enable AI natural language filtering.
          Your key is stored locally in your browser and never sent anywhere except Anthropic's API.
        </p>

        {hasKey && !removing && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--green-bg)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"var(--green)", fontSize:13 }}>✓</span>
              <span style={{ fontSize:13, color:"var(--green)", fontWeight:500 }}>API key saved</span>
            </div>
            <button className="btn-danger" style={{ fontSize:11, padding:"4px 10px" }} onClick={handleRemove}>
              Remove
            </button>
          </div>
        )}

        {removing && (
          <div style={{ fontSize:13, color:"var(--red)", marginBottom:16 }}>
            Key removed.
          </div>
        )}

        <label className="form-label">{hasKey ? "Replace key" : "Anthropic API Key"}</label>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <input
            type={visible ? "text" : "password"}
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="sk-ant-..."
            style={{ flex:1 }}
          />
          <button
            className="btn-ghost"
            style={{ fontSize:12, flexShrink:0 }}
            onClick={() => setVisible(v => !v)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>

        <p style={{ fontSize:11, color:"var(--text3)", marginBottom:20 }}>
          Get your key at{" "}
          <span style={{ color:"var(--indigo)" }}>console.anthropic.com</span>
          {" "}→ API Keys → Create Key
        </p>

        {saved && (
          <div style={{ fontSize:12, color:"var(--green)", marginBottom:12 }}>
            ✓ API key saved — AI filtering is now active
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave} disabled={!key.trim()} style={{ opacity: key.trim() ? 1 : 0.5 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
