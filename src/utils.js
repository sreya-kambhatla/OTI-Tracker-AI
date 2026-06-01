import { STORAGE_KEY, CHART_COLORS, MONTHS, TEMPLATE_HEADERS, STATUS_OPTIONS, PRIORITY_OPTIONS } from './constants';

export function calcHours(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 10) / 10;
}

export function groupByOTI(logs) {
  return logs.reduce((acc, log) => {
    if (!acc[log.otiId]) acc[log.otiId] = [];
    acc[log.otiId].push(log);
    return acc;
  }, {});
}

export function groupByAssignee(logs) {
  return logs.reduce((acc, log) => {
    if (!acc[log.assignee]) acc[log.assignee] = [];
    acc[log.assignee].push(log);
    return acc;
  }, {});
}

export function getWeekKey(dateStr) {
  const d   = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const sortKey = mon.toISOString().slice(0, 10);
  return sortKey;
}

export function getWeekLabel(sortKey) {
  const mon = new Date(sortKey + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return formatWeekLabel(sortKey) + " → " + formatWeekLabel(sun.toISOString().slice(0,10));
}

export function ordinal(n) {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

export function formatWeekLabel(isoDate) {
  const d     = new Date(isoDate + "T00:00:00");
  const month = MONTHS[d.getMonth()];
  const day   = ordinal(d.getDate());
  const year  = d.getFullYear();
  return month + " " + day + ", " + year;
}

export function groupByWeek(logs) {
  return logs.reduce((acc, log) => {
    const key = getWeekKey(log.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(log);
    return acc;
  }, {});
}

export function sumHours(logs) {
  return Math.round(logs.reduce((s, l) => s + l.hours, 0) * 10) / 10;
}

export function applyFilters(logs, filters) {
  return logs.filter(log => {
    const q = filters.search.toLowerCase();
    if (q && !log.otiId.toLowerCase().includes(q) && !log.title.toLowerCase().includes(q) && !log.assignee.toLowerCase().includes(q)) return false;
    if (filters.assignee && log.assignee !== filters.assignee) return false;
    if (filters.status   && log.status   !== filters.status)   return false;
    if (filters.priority && log.priority !== filters.priority) return false;
    if (filters.year     && !log.date.startsWith(filters.year))                      return false;
    if (filters.month    && log.date.slice(5, 7) !== filters.month)                  return false;
    return true;
  });
}

export function statusStyle(s) {
  if (s === "Completed") return { background: "rgba(16,185,129,0.15)", color: "#10b981" };
  if (s === "Blocked")   return { background: "rgba(239,68,68,0.15)",  color: "#ef4444" };
  return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
}

export function priorityStyle(p) {
  if (p === "Critical") return { background: "rgba(220,38,38,0.2)",   color: "#dc2626", fontWeight: 700 };
  if (p === "XXL")      return { background: "rgba(234,88,12,0.15)",  color: "#ea580c" };
  if (p === "High")     return { background: "rgba(239,68,68,0.12)",  color: "#ef4444" };
  if (p === "Medium")   return { background: "rgba(245,158,11,0.15)", color: "#f59e0b" };
  return { background: "rgba(16,185,129,0.15)", color: "#10b981" };
}

export function isCritical(p) { return p === "Critical"; }

export function exportToCSV(logs) {
  const headers = ["ID","OTI ID","Title","Created By","Assignee","Status","Priority","Date","Start","End","Hours","Notes"];
  const rows    = logs.map(l => [l.id,l.otiId,l.title,l.lead,l.assignee,l.status,l.priority,l.date,l.startTime,l.endTime,l.hours,l.notes||""]);
  const csv     = [headers,...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const a       = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: `oti-export-${new Date().toISOString().slice(0,10)}.csv`,
  });
  a.click();
}

export function formatDisplayDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate || "";
  const [y, m, d] = isoDate.split("-");
  return `${m}/${d}/${y}`;
}

export function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS,
    ["OTI-27720","Clean up for BVE Tasklist","Azam","Sreya","In Progress","Medium","2026-05-08","10:00","16:00","6",""],
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const a   = Object.assign(document.createElement("a"), {
    href:     URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: "oti-tracker-template.csv",
  });
  a.click();
}

export function parseExcelJSON(json) {
  if (!json || json.length === 0) return { error: "File is empty or has no data rows." };

  const colMap = {
    otiId:      ["oti id","oti#","otiid","ticket"],
    title:      ["title","task","task name","description"],
    createdBy:  ["created by","createdby","creator","lead","owner"],
    assignee:   ["assignee","assigned","assigned to","worker"],
    status:     ["status"],
    priority:   ["priority"],
    date:       ["date","log date","start date","work date"],
    startTime:  ["start time","start","starttime","time in"],
    endTime:    ["end time","end","endtime","time out"],
    hours:      ["hours","hrs","time spent (hrs)","total hours","duration","time spent"],
    notes:      ["notes","note","comments"],
  };

  const sampleKeys = Object.keys(json[0]).map(k => k.toLowerCase().trim());
  const idx = {};
  for (const [field, aliases] of Object.entries(colMap)) {
    const found = sampleKeys.findIndex(k => aliases.includes(k));
    idx[field]  = found !== -1 ? Object.keys(json[0])[found] : null;
  }

  const missing = ["otiId","assignee","date"].filter(f => !idx[f]);
  if (missing.length > 0) return { error: "Missing required columns: " + missing.join(", ") + ". Download the template to see the expected format." };

  const logs   = [];
  const errors = [];

  json.forEach((row, i) => {
    const get = field => idx[field] ? String(row[idx[field]] || "").trim() : "";

    const rawOti    = get("otiId").split("/")[0].trim();
    const otiId     = rawOti
      .replace(/^OTI[_\s]*(\d)/i, "OTI-$1")
      .replace(/^OTI-(\d)/i, "OTI-$1")
      .replace(/\s+/g, "")
      .toUpperCase();
    const title     = get("title");
    const createdBy = get("createdBy");
    const assignee  = get("assignee");
    const date      = normaliseDate(get("date"));
    const startTime = normaliseTime(get("startTime")) || "09:00";
    const endTime   = normaliseTime(get("endTime"))   || "17:00";
    const notes     = get("notes")     || "";

    const rawStatus   = get("status").toLowerCase().replace(/\s/g,"");
    const status      = rawStatus === "completed" ? "Completed" : rawStatus === "blocked" ? "Blocked" : "In Progress";

    const rawPriority = get("priority").toLowerCase();
    const priority    = rawPriority.includes("critical") ? "Critical"
                      : rawPriority.includes("xxl") || rawPriority.includes("asap") ? "XXL"
                      : rawPriority.includes("high") ? "High"
                      : rawPriority.includes("low")  ? "Low"
                      : "Medium";

    let hours = parseFloat(get("hours"));
    if (isNaN(hours) || hours <= 0) hours = 0;

    const normOtiId = otiId
      .replace(/^OTI[_\s]*(\d)/i, "OTI-$1")
      .replace(/\s+/g, "")
      .toUpperCase();

    if (!normOtiId.match(/^OTI-\d+$/) || !date) {
      errors.push("Row " + (i + 2) + ": missing OTI ID or date — skipped");
      return;
    }

    logs.push({
      id: "imported-" + i + "-" + Date.now(),
      otiId: normOtiId, title, createdBy, assignee, status, priority,
      date, startTime, endTime, hours, notes,
    });
  });

  return { logs, errors };
}

function parseCSVRow(raw) {
  const cols = [];
  let cur = "", inQuote = false;
  for (let ci = 0; ci < raw.length; ci++) {
    const ch = raw[ci];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = ""; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols;
}

function normaliseDate(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // YYYY/MM/DD
  const isoSlash = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (isoSlash) return `${isoSlash[1]}-${isoSlash[2]}-${isoSlash[3]}`;
  // X/Y/YYYY or X-Y-YYYY (MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD-MM-YYYY)
  const parts = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (parts) {
    const [, a, b, y] = parts;
    const an = parseInt(a, 10), bn = parseInt(b, 10);
    let month, day;
    if (an > 12)      { day = a; month = b; }  // must be DD-?-YYYY
    else if (bn > 12) { month = a; day = b; }  // must be MM-DD-YYYY
    else              { month = a; day = b; }  // ambiguous → default MM/DD/YYYY
    return `${y}-${month.padStart(2,"0")}-${day.padStart(2,"0")}`;
  }
  // Excel serial number (integer like 46111 = Jan 30, 2026)
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 1 && serial < 100000) {
      const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000);
      if (!isNaN(dt)) return dt.toISOString().slice(0, 10);
    }
  }
  // JS Date string fallback
  try {
    const dt = new Date(s);
    if (!isNaN(dt)) return dt.toISOString().slice(0,10);
  } catch {}
  return s;
}

function normaliseTime(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const [h, m] = s.split(":");
    return `${h.padStart(2,"0")}:${m}`;
  }
  // Excel time fraction (0.0–1.0 representing fraction of a day)
  const num = parseFloat(s);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMins = Math.round(num * 24 * 60);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
  }
  return s;
}

export function parseCSV(text) {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { error: "File is empty or has no data rows." };

  const headers = parseCSVRow(lines[0]).map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const colMap = {
    otiid:      ["oti id","otiid","oti_id","ticket","ticket id"],
    title:      ["title","task","task name","description"],
    createdBy:  ["created by","createdby","creator","lead","owner","team lead"],
    assignee:   ["assignee","assigned to","assigned","worker"],
    status:     ["status"],
    priority:   ["priority"],
    date:       ["date","log date","work date"],
    startTime:  ["start time","start","starttime","time in"],
    endTime:    ["end time","end","endtime","time out"],
    hours:      ["hours","hrs","time","total hours","duration"],
    notes:      ["notes","note","comments","comment"],
  };

  const idx = {};
  for (const [field, aliases] of Object.entries(colMap)) {
    const found = headers.findIndex(h => aliases.includes(h));
    idx[field] = found;
  }

  const missing = ["otiid","title","assignee","date"].filter(f => idx[f] === -1);
  if (missing.length > 0) return { error: `Missing required columns: ${missing.join(", ")}. Download the template to see the expected format.` };

  const logs = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const raw  = lines[i];
    const cols = parseCSVRow(raw);
    const get  = (field) => idx[field] !== -1 ? (cols[idx[field]] || "").replace(/^"|"$/g,"").trim() : "";

    const otiId     = get("otiid");
    const title     = get("title");
    const createdBy = get("createdBy");
    const assignee  = get("assignee");
    const date      = normaliseDate(get("date"));
    const startTime = get("startTime") || "09:00";
    const endTime   = get("endTime")   || "17:00";
    const rawStatus = (get("status") || "").toLowerCase().replace(/\s/g,"");
    const status = rawStatus === "completed" ? "Completed"
                 : rawStatus === "blocked"   ? "Blocked"
                 : "In Progress";
    const rawPriority = (get("priority") || "").toLowerCase().trim();
    const priority = rawPriority.includes("critical") ? "Critical"
                   : rawPriority.includes("xxl") || rawPriority.includes("asap") ? "XXL"
                   : rawPriority.includes("high") ? "High"
                   : rawPriority.includes("low")  ? "Low"
                   : "Medium";
    const notes     = get("notes")     || "";

    let hours = parseFloat(get("hours"));
    if (isNaN(hours) || hours <= 0) {
      const h = calcHours(startTime, endTime);
      hours   = h > 0 ? h : 0;
    }

    if (!otiId || !date) { errors.push(`Row ${i+1}: missing OTI ID or date — skipped`); continue; }

    logs.push({
      id: `imported-${i}-${Date.now()}`,
      otiId, title, createdBy, assignee, status, priority,
      date, startTime, endTime, hours, notes,
    });
  }

  return { logs, errors, headers: lines[0].split(",").map(h => h.replace(/^"|"$/g,"").trim()) };
}

export function loadFromStorage() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function saveToStorage(logs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); } catch {}
}
