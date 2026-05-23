import React from 'react';

function AIChat({ logs }) {
  const [open,     setOpen]     = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "assistant", text: "Hi! I can answer questions about your team's OTI data. Try asking who hasn't logged this week, which OTIs are overdue, or ask me to summarise any OTI." }
  ]);
  const [input,    setInput]    = React.useState("");
  const [loading,  setLoading]  = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function buildContext() {
    const assignees  = [...new Set(logs.map(l => l.assignee))];
    const otiIds     = [...new Set(logs.map(l => l.otiId))];
    const today      = new Date().toISOString().slice(0, 10);
    const weekStart  = (() => {
      const d = new Date(); const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      return d.toISOString().slice(0, 10);
    })();

    const otiSummaries = Object.entries(
      logs.reduce((acc, log) => {
        if (!acc[log.otiId]) acc[log.otiId] = { title: log.title, assignee: log.assignee, createdBy: log.createdBy, status: log.status, priority: log.priority, hours: 0, days: new Set(), lastDate: "" };
        acc[log.otiId].hours += log.hours;
        acc[log.otiId].days.add(log.date);
        if (log.date > acc[log.otiId].lastDate) { acc[log.otiId].lastDate = log.date; acc[log.otiId].status = log.status; }
        return acc;
      }, {})
    ).map(([id, d]) => `${id}: "${d.title}" | assignee: ${d.assignee} | createdBy: ${d.createdBy} | status: ${d.status} | priority: ${d.priority} | totalHours: ${Math.round(d.hours*10)/10} | daysLogged: ${d.days.size} | lastLogged: ${d.lastDate}`).join("\n");

    const assigneeSummaries = Object.entries(
      logs.reduce((acc, log) => {
        if (!acc[log.assignee]) acc[log.assignee] = { hours: 0, otis: new Set(), lastDate: "", thisWeek: 0 };
        acc[log.assignee].hours += log.hours;
        acc[log.assignee].otis.add(log.otiId);
        if (log.date > acc[log.assignee].lastDate) acc[log.assignee].lastDate = log.date;
        if (log.date >= weekStart) acc[log.assignee].thisWeek += log.hours;
        return acc;
      }, {})
    ).map(([name, d]) => `${name}: totalHours: ${Math.round(d.hours*10)/10} | otis: ${d.otis.size} | lastLogged: ${d.lastDate} | hoursThisWeek: ${Math.round(d.thisWeek*10)/10}`).join("\n");

    return `You are an AI assistant for a team OTI tracking dashboard. Answer questions conversationally and helpfully based on the data below. Be specific with names, numbers and dates. Today is ${today}. This week started ${weekStart}.

OTI SUMMARY (${otiIds.length} OTIs):
${otiSummaries}

ASSIGNEE SUMMARY (${assignees.length} team members):
${assigneeSummaries}`;
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const context = buildContext();
      const history = messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text
      }));

      const response = await fetch("https://oti-proxy.vercel.app/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1024,
          system: context,
          messages: [...history, { role: "user", content: userMsg }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || "Request failed");
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
      setMessages(prev => [...prev, { role: "assistant", text }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, something went wrong: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function formatMsg(text) {
    return text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^### (.+)$/gm, '<div style="font-weight:700;font-size:13px;margin:8px 0 4px;color:var(--indigo)">$1</div>')
      .replace(/^## (.+)$/gm, '<div style="font-weight:700;font-size:14px;margin:10px 0 4px;color:var(--text)">$1</div>')
      .replace(/^# (.+)$/gm, '<div style="font-weight:700;font-size:15px;margin:10px 0 4px;color:var(--text)">$1</div>')
      .replace(/^- (.+)$/gm, '<div style="padding-left:12px">• $1</div>')
      .replace(/
/g, "<br/>");
  }

  const suggestions = [
    "Who hasn't logged this week?",
    "Which OTIs are critical?",
    "Who is most overloaded?",
    "Summarise this week's activity",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 200,
          width: 52, height: 52, borderRadius: "50%",
          background: "var(--indigo)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, boxShadow: "0 4px 24px rgba(99,102,241,0.5)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="AI Assistant"
      >
        {open ? "✕" : "✦"}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 28, zIndex: 200,
          width: 380, height: 520,
          background: "rgba(15,25,50,0.85)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 16, display: "flex", flexDirection: "column",
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>AI Assistant</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Powered by Claude · {logs.length} entries loaded</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}>
                <div style={{
                  maxWidth: "85%", padding: "9px 13px", borderRadius: 12,
                  fontSize: 13, lineHeight: 1.6,
                  background: msg.role === "user" ? "var(--indigo)" : "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: msg.role === "assistant" ? 4 : 12,
                  whiteSpace: "pre-wrap",
                }}>
                  <span dangerouslySetInnerHTML={{ __html: formatMsg(msg.text) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "9px 13px", borderRadius: 12, borderBottomLeftRadius: 4,
                  background: "rgba(255,255,255,0.06)", fontSize: 13, color: "var(--text3)"
                }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: "0 14px 10px", display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} style={{
                  fontSize: 11, padding: "3px 10px", borderRadius: 20,
                  border: "1px solid var(--border2)", background: "transparent",
                  color: "var(--text2)", cursor: "pointer",
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 8, flexShrink: 0,
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your OTI data..."
              rows={2}
              disabled={loading}
              style={{
                flex: 1, resize: "none", fontSize: 13,
                padding: "8px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text)", outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: loading || !input.trim() ? "rgba(99,102,241,0.4)" : "var(--indigo)",
                color: "#fff", cursor: loading || !input.trim() ? "default" : "pointer",
                fontSize: 18, alignSelf: "flex-end", flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default AIChat;
