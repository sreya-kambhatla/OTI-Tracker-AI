# Team OTI Tracker Dashboard

A full-stack business intelligence dashboard built to replace manual Excel-based team tracking workflows. This project was conceived, designed, and developed as a complete BA-to-delivery lifecycle — from identifying a process inefficiency to shipping a working product.

---

## 🎯 Problem Statement

Teams managing multiple operational tasks (OTIs) were tracking daily work logs in shared Excel spreadsheets. This created several pain points:

- **No visibility** — team leads had to manually scan rows to understand workload distribution
- **No aggregation** — total hours, average per day, and busiest tasks required manual calculation
- **Inconsistent data entry** — different date formats, time formats, and priority labels across team members
- **No historical analysis** — no easy way to review a specific week or compare assignee workloads over time

---

## 💡 Solution

A web-based dashboard that:

- Imports existing Excel/CSV data with a GitHub-style diff view showing exactly what will change before anything is applied
- Provides real-time summary metrics with animated flip cards
- Visualises workload by OTI, by week, and by assignee
- Allows inline editing, status updates, and log entry without leaving the browser
- **Ori** — an AI assistant powered by Claude that answers natural language questions about your team's data
- Persists data locally and exports back to CSV for stakeholders who prefer spreadsheets

---

## 🔍 Business Analysis Artifacts

### As-Is Process
```
Team member logs hours → Updates shared Excel → Team lead opens file → 
Manually scans rows → No summary → No trend visibility
```

### To-Be Process
```
Team member logs hours → Imports CSV (2 clicks) → Diff view shows changes → 
Confirm → Dashboard auto-calculates → Ask Ori for insights
```

### Key Requirements Identified
| ID  | Requirement | Priority |
|-----|-------------|----------|
| R01 | Import existing Excel data without reformatting | Must Have |
| R02 | Display hours per OTI with status indicators | Must Have |
| R03 | Filter by assignee, status, priority, month, year | Must Have |
| R04 | Show weekly summary grouped by work week | Must Have |
| R05 | Show workload per assignee with last logged date | Must Have |
| R06 | Allow inline editing of log entries | Should Have |
| R07 | Export filtered data back to CSV | Should Have |
| R08 | Persist data between sessions | Should Have |
| R09 | Critical priority visual indicator | Could Have |
| R10 | Glassmorphism UI with dark theme | Could Have |
| R11 | AI natural language assistant | Could Have |
| R12 | GitHub-style diff view for imports | Could Have |

---

## 🚀 Features

### Dashboard Overview
- **4 flip cards** — In Progress, Completed, Blocked, Team Overview. Click any card to reveal the full list
- **Animated metrics** — numbers count up on load for a polished feel

### Ori — AI Assistant
- **Animated robot mascot** named Ori with three states:
  - **Greeting** — Ori introduces herself with two animated speech bubbles on first open
  - **Thinking** — spinning gears above head, eyes scan left/right while processing
  - **Response ready** — eyes squint with glee, sparkles appear around antenna, gentle bounce
- **Floating chat button** — accessible from all tabs, never in the way
- **Conversational responses** — powered by Claude, reads your actual OTI and team data
- **Ask anything** — "Who hasn't logged this week?", "Who is most overloaded?", "Summarise OTI-XXXXX", "Generate standup notes"
- **Contextual suggestion chips** — after every response, Ori generates 3 relevant follow-up questions as clickable pills
- **Chat history** — previous conversations persist when the panel is closed and reopened within a session
- **Markdown rendering** — responses render with proper bold, headings, and bullet points
- **Secure backend** — API key stored on Vercel serverless function, never exposed in the browser

### Smart Import with Diff View
- **First import** — simple scrollable preview table showing all rows before confirming
- **Re-import** — GitHub-style side-by-side diff view:
  - 🟢 **Green** — new rows not in dashboard yet
  - 🟡 **Amber** — existing rows with changes (changed fields show old value crossed out → new value)
  - 🔴 **Red** — rows present in dashboard but missing from file
  - ⬜ **Grey** — identical rows, collapsed by default
- **Filter tabs** — All · New · Changed · Removed · Unchanged with counts
- **Expandable rows** — click any row to see all 10 fields in a detail panel
- **Merge logic** — new rows added, changed rows updated in place, unchanged rows skipped
- **Legend pills** — colour-coded legend matches filter tab style

### OTI Management
- **OTI cards** — total hours, days logged, average per day, assignee, last logged date
- **Inline editing** — click the edit icon on any log row to update in place
- **Quick status change** — change OTI status directly from the card
- **Delete confirmation** — custom modal prevents accidental deletions
- **Notes field** — optional notes per log entry for blockers or progress updates

### Filtering & Search
- Search by OTI ID, title, or assignee name
- Dropdown filters for status, priority, assignee, year, and month
- Sort by last logged, most hours, or least hours
- Active filter count badge

### Data Import / Export
- Drag-and-drop or browse import for `.xlsx`, `.xls`, and `.csv`
- Smart column mapping — recognises common column name variations automatically
- Date normalisation — handles both `YYYY-MM-DD` and `M/D/YYYY` formats consistently
- Export downloads the current filtered view as a timestamped CSV

### Views
- **OTIs tab** — all active OTIs sorted by last logged date
- **Weekly summary** — logs grouped by work week with a month filter
- **Assignee workload** — per-person table showing OTIs, status, days worked, and last logged

### Priority System
| Level | Colour | Visual |
|-------|--------|--------|
| Low | Green | Standard badge |
| Medium | Amber | Standard badge |
| High | Red | Standard badge |
| XXL | Orange-red | Standard badge |
| Critical | Deep red | Pulsing badge |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 |
| Build tool | Vite 4 |
| Styling | Custom CSS with CSS variables + glassmorphism |
| Excel parsing | SheetJS (xlsx) |
| AI assistant | Anthropic Claude API (claude-sonnet-4-5) |
| AI proxy | Vercel Serverless Function |
| Data persistence | localStorage |
| Deployment | GitHub Pages |
| CI/CD | GitHub Actions — auto-deploy on push to main |

---

## 📁 Project Structure

```
OTI-Tracker-AI/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-build and deploy pipeline
├── src/
│   ├── App.jsx                 # Root component, state management, merge logic
│   ├── constants.js            # Config values, options, default states
│   ├── utils.js                # Utility functions (calc, filter, storage, export, date normalisation)
│   ├── index.css               # Global styles with CSS variables + glassmorphism
│   ├── main.jsx                # React entry point
│   └── components/
│       ├── TopBar.jsx          # Fixed navigation header
│       ├── Dashboard.jsx       # Overview metrics and flip cards
│       ├── AIChat.jsx          # Ori — floating AI assistant with animated robot
│       ├── Filters.jsx         # Search and filter controls
│       ├── AddEntryForm.jsx    # Collapsible log entry form
│       ├── OTICard.jsx         # Individual OTI card with inline edit
│       ├── WeeklyView.jsx      # Weekly grouped summary table
│       ├── WorkloadView.jsx    # Per-assignee workload table
│       ├── ImportModal.jsx     # Smart diff import with merge logic
│       ├── SettingsModal.jsx   # API key configuration
│       └── Toast.jsx           # Auto-dismissing notification
├── index.html
├── package.json
├── sample_data.csv             # Demo dataset (133 rows)
├── sample_data_v2.csv          # Test dataset for diff import (143 rows, 5 changed + 10 new)
└── vite.config.js
```

---

## 🏗 Architecture

```
Browser (GitHub Pages)
        │
        │ User asks Ori a question
        ▼
Vercel Serverless Function (oti-proxy)
        │
        │ Forwards request with API key
        ▼
Anthropic Claude API
        │
        │ Returns conversational response + SUGGESTIONS:[...]
        ▼
Dashboard parses suggestions, renders formatted response + clickable chips
```

The Vercel proxy keeps the API key secure — it never touches the browser.

---

## 🤖 Ori — AI Architecture

### Request Flow
| Step | Component | Action |
|------|-----------|--------|
| 1 | Dashboard (Browser) | User types question in Ori's chat panel |
| 2 | Dashboard (Browser) | Sends OTI data + question + chat history to Vercel proxy |
| 3 | Vercel Function | Receives request, adds API key from environment variable |
| 4 | Vercel Function | Forwards complete request to Anthropic API |
| 5 | Anthropic Claude API | Processes question with OTI context, returns answer + suggestions |
| 6 | Vercel Function | Passes response back to dashboard |
| 7 | Dashboard (Browser) | Parses SUGGESTIONS:[...] block, renders formatted response + chips |

### Security
- API key stored as environment variable in Vercel — never in the codebase or browser
- Vercel function acts as secure middleware
- No user data stored by the proxy — only forwards and returns

### Ori's Personality
Ori is the AI mascot — a cute round robot with cyan glowing eyes, a white body, and an indigo antenna. She has three animated states that respond to what she's doing:

- **Greeting** — gentle bob, alternating speech bubbles introducing herself and her capabilities
- **Thinking** — spinning gears above her head, eyes scan left and right
- **Response ready** — eyes squint with glee, sparkles appear, gentle bounce

### Context Sent Per Request
- Per-OTI summary: ID, title, assignee, creator, status, priority, total hours, days logged, last logged
- Per-assignee summary: total hours, number of OTIs, last logged, hours this week
- Current date and week start for time-relative queries
- Full chat history for follow-up question support

### Contextual Suggestions
Every response ends with `SUGGESTIONS:["q1","q2","q3"]` which the dashboard strips and renders as clickable pill buttons below the message. Clicking sends the question immediately.

---

## 📥 Import Format

| Column | Format | Example |
|--------|--------|---------|
| OTI ID | OTI-XXXXX | OTI-10023 |
| Title | Free text | Update auth flow |
| Created By | Name | Alex |
| Assignee | Name | Jordan |
| Status | Dropdown | In Progress |
| Priority | Dropdown | High |
| Date | YYYY-MM-DD or M/D/YYYY | 2026-05-08 |
| Start Time | HH:MM (24hr) | 09:00 |
| End Time | HH:MM (24hr) | 17:00 |
| Hours | Decimal | 8 |
| Notes | Free text | Optional |

---

## 🔀 Merge Import Logic

The unique key for each row is `OTI ID + Date + Assignee`. On re-import:

| Row type | Action |
|----------|--------|
| New key — not in dashboard | Added |
| Existing key — fields changed | Updated in place, original ID preserved |
| Existing key — no changes | Skipped |
| In dashboard — missing from file | Shown as Removed in diff, not deleted unless confirmed |

---

## 🚀 Getting Started

### Live Application
https://sreya-kambhatla.github.io/OTI-Tracker-AI/

### Local Development
```bash
git clone https://github.com/sreya-kambhatla/OTI-Tracker-AI.git
cd OTI-Tracker-AI
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📊 Sample Data

Two datasets are included for testing:

- `sample_data.csv` — 133 rows, 15 OTIs, 7 team members
- `sample_data_v2.csv` — 143 rows: same 133 + 10 new rows + 5 changed rows

**Test the diff import:**
1. Import `sample_data.csv` → 133 rows, simple preview
2. Import `sample_data_v2.csv` → diff shows 10 new · 4 changed · 128 unchanged

---

## 🗺 Roadmap

| Feature | Status |
|---------|--------|
| Core dashboard + import/export | ✅ Complete |
| Inline editing + delete confirmation | ✅ Complete |
| Weekly summary + assignee workload | ✅ Complete |
| 5-level priority with Critical indicator | ✅ Complete |
| Glassmorphism UI | ✅ Complete |
| Ori — AI assistant with animated mascot | ✅ Complete |
| Contextual follow-up suggestion chips | ✅ Complete |
| Secure Vercel proxy for AI | ✅ Complete |
| GitHub-style diff import with merge logic | ✅ Complete |
| Side-by-side diff view with filter tabs | ✅ Complete |
| Expandable row detail in diff view | ✅ Complete |
| Excel Online two-way sync | 🔜 Planned |
| Role-based views (team lead vs member) | 🔜 Planned |
| Email digest / weekly report export | 🔜 Planned |
| Migrate AI to Azure OpenAI | 🔜 Planned |

---

## 👩‍💼 About This Project

This project was built as a complete business analyst portfolio piece demonstrating:

- **Requirements elicitation** — identifying pain points in an existing workflow
- **Process mapping** — documenting as-is and to-be states
- **Stakeholder communication** — translating business needs into technical requirements
- **End-to-end delivery** — from problem statement to deployed product
- **Technical implementation** — React, Vite, SheetJS, GitHub Actions CI/CD
- **AI integration** — conversational AI assistant with animated mascot via Anthropic Claude API with secure Vercel proxy
- **Data integrity** — GitHub-style diff view ensuring transparent, controlled data imports

---

## 🔗 Repositories

- **Dashboard:** github.com/sreya-kambhatla/OTI-Tracker-AI
- **AI Proxy:** github.com/sreya-kambhatla/oti-proxy

---

*Built with React + Vite. Deployed on GitHub Pages. AI powered by Claude.*
