import React from 'react';

function AIChat({ logs }) {
  const [open,     setOpen]     = React.useState(false);
  const [messages, setMessages] = React.useState([]);
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

After every response, add exactly this block on a new line at the very end — no exceptions:
SUGGESTIONS:["suggestion 1","suggestion 2","suggestion 3"]
Make the suggestions short (under 6 words each), relevant to what was just discussed, and genuinely useful follow-up questions the user would want to ask next. Never include the SUGGESTIONS block in the middle of your answer, only at the very end.

OTI SUMMARY (${otiIds.length} OTIs):
${otiSummaries}

ASSIGNEE SUMMARY (${assignees.length} team members):
${assigneeSummaries}`;
  }

  async function handleSend(overrideMsg) {
    const userMsg = (typeof overrideMsg === "string" ? overrideMsg : input).trim();
    if (!userMsg || loading) return;
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
      const raw  = data.content?.[0]?.text || "Sorry, I couldn't get a response.";

      // Extract suggestions from end of response
      let text = raw;
      let suggestions = [];
      const sugMatch = raw.match(/SUGGESTIONS:\[([^\]]+)\]\s*$/);
      if (sugMatch) {
        try {
          suggestions = JSON.parse("[" + sugMatch[1] + "]");
        } catch {}
        text = raw.slice(0, sugMatch.index).trim();
      }

      setMessages(prev => [...prev, { role: "assistant", text, suggestions }]);
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
    const lines = text.split("\n");
    const html = lines.map(line => {
      if (line.startsWith("### ")) return "<div style='font-weight:700;font-size:13px;margin:8px 0 4px;color:var(--indigo)'>" + line.slice(4) + "</div>";
      if (line.startsWith("## "))  return "<div style='font-weight:700;font-size:14px;margin:10px 0 4px;color:var(--text)'>" + line.slice(3) + "</div>";
      if (line.startsWith("# "))   return "<div style='font-weight:700;font-size:15px;margin:10px 0 4px;color:var(--text)'>" + line.slice(2) + "</div>";
      if (line.startsWith("- "))   return "<div style='padding-left:12px'>&bull; " + line.slice(2) + "</div>";
      return line + "<br/>";
    }).join("");
    return html
      .replace(/[*][*](.+?)[*][*]/g, "<strong>$1</strong>")
      .replace(/[*]([^*]+)[*]/g, "<em>$1</em>");
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
        title="Ori"
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Ori</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>Powered by Claude · {logs.length} entries loaded</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Ori greeting */}
            {messages.length === 0 && (
              <div style={{ display:"flex", justifyContent:"center", paddingTop:8 }}>
                <svg viewBox="0 0 300 330" xmlns="http://www.w3.org/2000/svg" style={{ width:260, height:"auto" }}>
                  <defs>
                    <radialGradient id="ogg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#6FEBFF" stopOpacity="0.18"/><stop offset="100%" stopColor="#6FEBFF" stopOpacity="0"/></radialGradient>
                    <radialGradient id="obG" cx="35%" cy="25%" r="65%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#D6E2F0"/></radialGradient>
                    <radialGradient id="oeG" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#A8F8FF"/><stop offset="100%" stopColor="#00CFEE"/></radialGradient>
                    <filter id="oef"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    <style>{`
                      @keyframes og{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
                      @keyframes oe{0%,100%{transform:scaleY(1)}45%,55%{transform:scaleY(0.06)}}
                      @keyframes oa{0%,100%{opacity:0.6}50%{opacity:1}}
                      @keyframes obg{0%,100%{opacity:0.12}50%{opacity:0.22}}
                      @keyframes ob1{0%{opacity:0}10%{opacity:1}42%{opacity:1}52%{opacity:0}100%{opacity:0}}
                      @keyframes ob2{0%,48%{opacity:0}58%,100%{opacity:1}}
                      .ogb{animation:og 3s ease-in-out infinite}
                      .oeb{animation:oe 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
                      .oap{animation:oa 2s ease-in-out infinite}
                      .oggb{animation:obg 3s ease-in-out infinite}
                      .ob1{animation:ob1 7s ease-in-out infinite}
                      .ob2{animation:ob2 7s ease-in-out forwards}
                    `}</style>
                  </defs>
                  <ellipse className="oggb" cx="150" cy="210" rx="80" ry="80" fill="url(#ogg)"/>
                  <g className="ob1">
                    <rect x="40" y="18" width="220" height="48" rx="14" fill="#0f1c35"/>
                    <rect x="41" y="19" width="218" height="46" rx="13" fill="none" stroke="#6FEBFF" strokeWidth="1.3" opacity="0.55"/>
                    <path d="M138 64 L150 76 L162 64" fill="#0f1c35"/>
                    <path d="M138 64 L150 76 L162 64" fill="none" stroke="#6FEBFF" strokeWidth="1" opacity="0.4"/>
                    <text x="150" y="38" textAnchor="middle" fontSize="13" fill="#6FEBFF" fontFamily="Arial" fontWeight="700">Hi! I am Ori</text>
                    <text x="150" y="56" textAnchor="middle" fontSize="11.5" fill="#A5B4FC" fontFamily="Arial">your personal AI companion</text>
                  </g>
                  <g className="ob2">
                    <rect x="8" y="10" width="284" height="90" rx="14" fill="#0f1c35"/>
                    <rect x="9" y="11" width="282" height="88" rx="13" fill="none" stroke="#6FEBFF" strokeWidth="1.3" opacity="0.55"/>
                    <path d="M138 98 L150 110 L162 98" fill="#0f1c35"/>
                    <path d="M138 98 L150 110 L162 98" fill="none" stroke="#6FEBFF" strokeWidth="1" opacity="0.4"/>
                    <text x="150" y="32" textAnchor="middle" fontSize="12.5" fill="#A5B4FC" fontFamily="Arial">I can spot blockers, flag overdue</text>
                    <text x="150" y="50" textAnchor="middle" fontSize="12.5" fill="#A5B4FC" fontFamily="Arial">OTIs and summarise any task.</text>
                    <text x="150" y="68" textAnchor="middle" fontSize="12" fill="#6FEBFF" fontFamily="Arial" fontStyle="italic">"Who has not logged this week?"</text>
                    <text x="150" y="86" textAnchor="middle" fontSize="12" fill="#6FEBFF" fontFamily="Arial" fontStyle="italic">or "Summarise OTI-10023"</text>
                  </g>
                  <g className="ogb">
                    <ellipse cx="150" cy="322" rx="28" ry="6" fill="#6FEBFF" opacity="0.08"/>
                    <ellipse cx="90"  cy="255" rx="12" ry="20" fill="#E2EAF5" transform="rotate(15,90,255)"/>
                    <ellipse cx="210" cy="255" rx="12" ry="20" fill="#E2EAF5" transform="rotate(-15,210,255)"/>
                    <ellipse cx="150" cy="268" rx="43" ry="35" fill="url(#obG)"/>
                    <path d="M127 278 Q150 284 173 278" stroke="#C8D4E4" strokeWidth="1.5" fill="none"/>
                    <rect x="142" y="232" width="17" height="11" rx="5" fill="#C8D4E4"/>
                    <ellipse cx="150" cy="202" rx="52" ry="48" fill="url(#obG)"/>
                    <ellipse cx="135" cy="184" rx="22" ry="14" fill="white" opacity="0.13"/>
                    <rect x="107" y="180" width="86" height="52" rx="15" fill="#0c1628"/>
                    <rect x="109" y="182" width="82" height="48" rx="13" fill="#0f1c30"/>
                    <path d="M115 188 Q127 183 138 188" stroke="#6FEBFF" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6"/>
                    <path d="M162 188 Q174 183 186 188" stroke="#6FEBFF" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6"/>
                    <rect x="115" y="194" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                    <rect x="159" y="194" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                    <g className="oeb" filter="url(#oef)">
                      <rect x="117" y="196" width="22" height="18" rx="9" fill="url(#oeG)" opacity="0.95"/>
                      <ellipse cx="123" cy="201" rx="5" ry="4" fill="white" opacity="0.4"/>
                      <rect x="161" y="196" width="22" height="18" rx="9" fill="url(#oeG)" opacity="0.95"/>
                      <ellipse cx="167" cy="201" rx="5" ry="4" fill="white" opacity="0.4"/>
                    </g>
                    <path d="M139 218 Q150 224 161 218" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85"/>
                    <ellipse cx="99"  cy="200" rx="7" ry="13" fill="#E2EAF5"/>
                    <ellipse cx="99"  cy="200" rx="4.5" ry="8" fill="#C8D4E4"/>
                    <ellipse cx="201" cy="200" rx="7" ry="13" fill="#E2EAF5"/>
                    <ellipse cx="201" cy="200" rx="4.5" ry="8" fill="#C8D4E4"/>
                    <line x1="150" y1="155" x2="150" y2="136" stroke="#C8D4E4" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="150" cy="128" r="9" fill="#0c1628" stroke="#6FEBFF" strokeWidth="1.5" opacity="0.7"/>
                    <circle className="oap" cx="150" cy="128" r="5.5" fill="#6FEBFF"/>
                    <circle cx="150" cy="128" r="2.5" fill="white" opacity="0.9"/>
                    <ellipse cx="117" cy="221" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.35"/>
                    <ellipse cx="183" cy="221" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.35"/>
                  </g>
                </svg>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end", gap: 6,
              }}>
                {msg.role === "assistant" && i > 0 && (
                  <div style={{ width:44, height:60, flexShrink:0 }}>
                    <svg viewBox="0 0 190 260" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
                      <defs>
                        <radialGradient id="rbg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#6FEBFF" stopOpacity="0.28"/><stop offset="100%" stopColor="#6FEBFF" stopOpacity="0"/></radialGradient>
                        <radialGradient id="rbG" cx="35%" cy="25%" r="65%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#D6E2F0"/></radialGradient>
                        <radialGradient id="reG" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#C8FFFF"/><stop offset="100%" stopColor="#00E8FF"/></radialGradient>
                        <filter id="ref2"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        <filter id="rsf2"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                        <style>{`
                          @keyframes rb{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}60%{transform:translateY(-5px)}80%{transform:translateY(-9px)}}
                          @keyframes rq{0%,30%,100%{transform:scaleY(1)}55%,80%{transform:scaleY(0.08)}}
                          @keyframes rg{0%,100%{opacity:0.18;transform:scale(1)}50%{opacity:0.35;transform:scale(1.12)}}
                          @keyframes rsp{0%,100%{opacity:0;transform:scale(0.3) rotate(0deg)}50%{opacity:1;transform:scale(1.2) rotate(180deg)}}
                          .rbc{animation:rb 2.2s ease-in-out infinite}
                          .rqc{animation:rq 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
                          .rgc{animation:rg 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
                          .rs1c{animation:rsp 2s 0s infinite;transform-box:fill-box;transform-origin:center}
                          .rs2c{animation:rsp 2s 0.5s infinite;transform-box:fill-box;transform-origin:center}
                          .rs3c{animation:rsp 2s 1s infinite;transform-box:fill-box;transform-origin:center}
                          .rs4c{animation:rsp 2s 1.5s infinite;transform-box:fill-box;transform-origin:center}
                        `}</style>
                      </defs>
                      <ellipse className="rgc" cx="95" cy="160" rx="82" ry="82" fill="url(#rbg)"/>
                      <g className="rs1c" filter="url(#rsf2)"><text x="110" y="70" fontSize="18" fill="#6FEBFF">✦</text></g>
                      <g className="rs2c" filter="url(#rsf2)"><text x="62" y="63" fontSize="14" fill="#A5B4FC">✦</text></g>
                      <g className="rs3c" filter="url(#rsf2)"><text x="124" y="90" fontSize="12" fill="#6FEBFF">✦</text></g>
                      <g className="rs4c" filter="url(#rsf2)"><text x="54" y="86" fontSize="13" fill="#7C8CFF">✦</text></g>
                      <g className="rbc">
                        <ellipse cx="95" cy="252" rx="28" ry="6" fill="#6FEBFF" opacity="0.13"/>
                        <ellipse cx="34" cy="205" rx="12" ry="20" fill="#E2EAF5" transform="rotate(20,34,205)"/>
                        <ellipse cx="156" cy="205" rx="12" ry="20" fill="#E2EAF5" transform="rotate(-20,156,205)"/>
                        <ellipse cx="95" cy="208" rx="43" ry="35" fill="url(#rbG)"/>
                        <path d="M72 218 Q95 224 118 218" stroke="#C8D4E4" strokeWidth="1.5" fill="none"/>
                        <rect x="87" y="172" width="17" height="11" rx="5" fill="#C8D4E4"/>
                        <ellipse cx="95" cy="138" rx="52" ry="48" fill="url(#rbG)"/>
                        <ellipse cx="80" cy="120" rx="22" ry="14" fill="white" opacity="0.15"/>
                        <rect x="52" y="116" width="86" height="52" rx="15" fill="#0c1628"/>
                        <rect x="54" y="118" width="82" height="48" rx="13" fill="#0f1c30"/>
                        <path d="M60 124 Q72 118 83 124" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65"/>
                        <path d="M107 124 Q119 118 131 124" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.65"/>
                        <rect x="60" y="132" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                        <rect x="104" y="132" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                        <g className="rqc" filter="url(#ref2)"><rect x="62" y="134" width="22" height="18" rx="9" fill="url(#reG)" opacity="0.95"/><ellipse cx="68" cy="139" rx="5" ry="4" fill="white" opacity="0.4"/><rect x="106" y="134" width="22" height="18" rx="9" fill="url(#reG)" opacity="0.95"/><ellipse cx="112" cy="139" rx="5" ry="4" fill="white" opacity="0.4"/></g>
                        <path d="M84 158 Q95 165 106 158" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9"/>
                        <ellipse cx="44" cy="136" rx="7" ry="13" fill="#E2EAF5"/><ellipse cx="44" cy="136" rx="4.5" ry="8" fill="#C8D4E4"/>
                        <ellipse cx="146" cy="136" rx="7" ry="13" fill="#E2EAF5"/><ellipse cx="146" cy="136" rx="4.5" ry="8" fill="#C8D4E4"/>
                        <line x1="95" y1="91" x2="95" y2="72" stroke="#C8D4E4" strokeWidth="3" strokeLinecap="round"/>
                        <circle cx="95" cy="64" r="9" fill="#0c1628" stroke="#6FEBFF" strokeWidth="2"/>
                        <circle cx="95" cy="64" r="5.5" fill="#6FEBFF" opacity="0.95" filter="url(#ref2)"/>
                        <circle cx="95" cy="64" r="2.5" fill="white"/>
                        <ellipse cx="62" cy="160" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.38"/>
                        <ellipse cx="128" cy="160" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.38"/>
                      </g>
                    </svg>
                  </div>
                )}
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
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
                      {msg.suggestions.map((s, si) => (
                        <button key={si} onClick={() => handleSend(s)}
                          style={{
                            fontSize:11, padding:"4px 10px", borderRadius:20,
                            border:"1px solid rgba(99,102,241,0.4)",
                            background:"rgba(99,102,241,0.12)",
                            color:"var(--indigo)", cursor:"pointer",
                            transition:"background 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(99,102,241,0.25)"}
                          onMouseLeave={e => e.currentTarget.style.background="rgba(99,102,241,0.12)"}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", justifyContent:"flex-start", padding:"4px 0" }}>
                <div style={{ width:110, height:150 }}>
                  <svg viewBox="0 0 190 260" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"100%"}}>
                    <defs>
                      <radialGradient id="tbg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2"/><stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/></radialGradient>
                      <radialGradient id="tbG" cx="35%" cy="25%" r="65%"><stop offset="0%" stopColor="#FFFFFF"/><stop offset="100%" stopColor="#D6E2F0"/></radialGradient>
                      <radialGradient id="teG" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#A8F8FF"/><stop offset="100%" stopColor="#00CFEE"/></radialGradient>
                      <filter id="tef"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                      <style>{`
                        @keyframes t-hover{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
                        @keyframes t-cw{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                        @keyframes t-ccw{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
                        @keyframes t-fast{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                        @keyframes t-scan{0%,100%{transform:translateX(0)}30%,50%{transform:translateX(4px)}70%,90%{transform:translateX(-3px)}}
                        @keyframes t-blink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.06)}}
                        @keyframes t-ant{0%,100%{opacity:0.6}50%{opacity:1}}
                        @keyframes t-bg{0%,100%{opacity:0.12}50%{opacity:0.22}}
                        .th{animation:t-hover 3s ease-in-out infinite}
                        .tgcw{animation:t-cw 2.2s linear infinite;transform-box:fill-box;transform-origin:center}
                        .tgccw{animation:t-ccw 2.2s linear infinite;transform-box:fill-box;transform-origin:center}
                        .tgf{animation:t-fast 1.3s linear infinite;transform-box:fill-box;transform-origin:center}
                        .tsc{animation:t-scan 4s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
                        .tbl{animation:t-blink 5s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
                        .tap{animation:t-ant 2s ease-in-out infinite}
                        .tbg{animation:t-bg 3s ease-in-out infinite}
                      `}</style>
                    </defs>
                    <ellipse className="tbg" cx="95" cy="160" rx="75" ry="75" fill="url(#tbg)"/>
                    <g className="tgcw"><circle cx="78" cy="42" r="18" fill="none" stroke="#4F46E5" strokeWidth="3.5"/><circle cx="78" cy="42" r="9" fill="#0a0e1f" stroke="#4F46E5" strokeWidth="2"/><rect x="74" y="21" width="8" height="8" rx="2" fill="#4F46E5"/><rect x="74" y="55" width="8" height="8" rx="2" fill="#4F46E5"/><rect x="57" y="38" width="8" height="8" rx="2" fill="#4F46E5"/><rect x="91" y="38" width="8" height="8" rx="2" fill="#4F46E5"/><rect x="62" y="26" width="7" height="7" rx="2" fill="#4F46E5" transform="rotate(45,65,29)"/><rect x="62" y="50" width="7" height="7" rx="2" fill="#4F46E5" transform="rotate(-45,65,53)"/><rect x="87" y="26" width="7" height="7" rx="2" fill="#4F46E5" transform="rotate(-45,90,29)"/><rect x="87" y="50" width="7" height="7" rx="2" fill="#4F46E5" transform="rotate(45,90,53)"/></g>
                    <g className="tgccw"><circle cx="108" cy="48" r="12" fill="none" stroke="#7C8CFF" strokeWidth="2.5"/><circle cx="108" cy="48" r="6" fill="#0a0e1f" stroke="#7C8CFF" strokeWidth="1.5"/><rect x="105" y="34" width="6" height="6" rx="1.5" fill="#7C8CFF"/><rect x="105" y="56" width="6" height="6" rx="1.5" fill="#7C8CFF"/><rect x="96" y="45" width="6" height="6" rx="1.5" fill="#7C8CFF"/><rect x="118" y="45" width="6" height="6" rx="1.5" fill="#7C8CFF"/><rect x="99" y="37" width="6" height="6" rx="1.5" fill="#7C8CFF" transform="rotate(45,102,40)"/><rect x="99" y="53" width="6" height="6" rx="1.5" fill="#7C8CFF" transform="rotate(-45,102,56)"/><rect x="115" y="37" width="6" height="6" rx="1.5" fill="#7C8CFF" transform="rotate(-45,118,40)"/><rect x="115" y="53" width="6" height="6" rx="1.5" fill="#7C8CFF" transform="rotate(45,118,56)"/></g>
                    <g className="tgf"><circle cx="126" cy="36" r="9" fill="none" stroke="#A5B4FC" strokeWidth="2"/><circle cx="126" cy="36" r="4.5" fill="#0a0e1f" stroke="#A5B4FC" strokeWidth="1.5"/><rect x="123" y="25" width="5" height="5" rx="1" fill="#A5B4FC"/><rect x="123" y="42" width="5" height="5" rx="1" fill="#A5B4FC"/><rect x="115" y="33" width="5" height="5" rx="1" fill="#A5B4FC"/><rect x="133" y="33" width="5" height="5" rx="1" fill="#A5B4FC"/></g>
                    <g className="th">
                      <ellipse cx="95" cy="252" rx="28" ry="6" fill="#4F46E5" opacity="0.1"/>
                      <ellipse cx="36" cy="198" rx="12" ry="20" fill="#E2EAF5" transform="rotate(15,36,198)"/>
                      <ellipse cx="154" cy="198" rx="12" ry="20" fill="#E2EAF5" transform="rotate(-15,154,198)"/>
                      <ellipse cx="95" cy="208" rx="43" ry="35" fill="url(#tbG)"/>
                      <path d="M72 218 Q95 224 118 218" stroke="#C8D4E4" strokeWidth="1.5" fill="none"/>
                      <rect x="87" y="172" width="17" height="11" rx="5" fill="#C8D4E4"/>
                      <ellipse cx="95" cy="138" rx="52" ry="48" fill="url(#tbG)"/>
                      <ellipse cx="80" cy="120" rx="22" ry="14" fill="white" opacity="0.13"/>
                      <rect x="52" y="116" width="86" height="52" rx="15" fill="#0c1628"/>
                      <rect x="54" y="118" width="82" height="48" rx="13" fill="#0f1c30"/>
                      <path d="M60 126 Q72 121 83 126" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
                      <path d="M107 124 Q119 128 131 124" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
                      <rect x="60" y="132" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                      <rect x="104" y="132" width="26" height="22" rx="11" fill="#071020" opacity="0.9"/>
                      <g className="tbl"><g className="tsc" filter="url(#tef)"><rect x="62" y="134" width="22" height="18" rx="9" fill="url(#teG)" opacity="0.95"/><ellipse cx="68" cy="139" rx="5" ry="4" fill="white" opacity="0.35"/><rect x="106" y="134" width="22" height="18" rx="9" fill="url(#teG)" opacity="0.95"/><ellipse cx="112" cy="139" rx="5" ry="4" fill="white" opacity="0.35"/></g></g>
                      <path d="M84 158 Q95 163 106 158" stroke="#6FEBFF" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7"/>
                      <ellipse cx="44" cy="136" rx="7" ry="13" fill="#E2EAF5"/><ellipse cx="44" cy="136" rx="4.5" ry="8" fill="#C8D4E4"/>
                      <ellipse cx="146" cy="136" rx="7" ry="13" fill="#E2EAF5"/><ellipse cx="146" cy="136" rx="4.5" ry="8" fill="#C8D4E4"/>
                      <line x1="95" y1="91" x2="95" y2="72" stroke="#C8D4E4" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="95" cy="64" r="9" fill="#0c1628" stroke="#6FEBFF" strokeWidth="1.5" opacity="0.6"/>
                      <circle className="tap" cx="95" cy="64" r="5.5" fill="#6FEBFF"/>
                      <circle cx="95" cy="64" r="2.5" fill="white" opacity="0.9"/>
                      <ellipse cx="62" cy="160" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.25"/>
                      <ellipse cx="128" cy="160" rx="9" ry="5.5" fill="#FFB3C6" opacity="0.25"/>
                    </g>
                  </svg>
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
