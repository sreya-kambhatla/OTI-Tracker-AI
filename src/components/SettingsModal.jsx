import React from 'react';
import { SettingsIcon } from './Icons';

function SettingsModal({ onClose }) {
  const [key,     setKey]     = React.useState(() => localStorage.getItem("oti-ai-key") || "");
  const [saved,   setSaved]   = React.useState(false);
  const [visible, setVisible] = React.useState(false);

  function handleSave() {
    if (key.trim()) {
      localStorage.setItem("oti-ai-key", key.trim());
    } else {
      localStorage.removeItem("oti-ai-key");
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  function handleClear() {
    setKey("");
    localStorage.removeItem("oti-ai-key");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width:480 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
          <SettingsIcon size={16} /> Settings
        </h3>
        <p style={{ marginBottom:24 }}>
          Configure your Anthropic API key to enable the AI natural language filtering feature.
          Your key is stored locally in your browser and never sent anywhere except Anthropic's API.
        </p>

        <label className="form-label">Anthropic API Key</label>
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

        <p style={{ fontSize:11, color:"var(--text3)", marginBottom:24 }}>
          Get your free API key at{" "}
          <span style={{ color:"var(--indigo)" }}>console.anthropic.com</span>
          {" "}→ API Keys → Create Key
        </p>

        {saved && (
          <div style={{ fontSize:12, color:"var(--green)", marginBottom:12 }}>
            ✓ API key saved — AI filtering is now active
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"space-between" }}>
          <button className="btn-danger" onClick={handleClear}>Clear key</button>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
