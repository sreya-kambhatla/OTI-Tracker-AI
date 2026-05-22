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

- Imports existing Excel/CSV data with smart column mapping and data normalisation
- Provides real-time summary metrics with animated flip cards
- Visualises workload by OTI, by week, and by assignee
- Allows inline editing, status updates, and log entry without leaving the browser
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
Team member logs hours → Imports CSV (2 clicks) → Dashboard auto-calculates → 
Team lead sees summary cards, weekly trends, and assignee workload instantly
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

---

## 🚀 Features

### Dashboard Overview
- **4 flip cards** — In Progress, Completed, Blocked, Team Overview. Click any card to reveal the full list of OTIs or team members
- **Animated metrics** — numbers count up on load for a polished feel

### OTI Management
- **OTI cards** — each card shows total hours, days logged, average per day, assignee, and last logged date
- **Inline editing** — click the edit icon on any log row to edit in place
- **Quick status change** — change OTI status directly from the card without opening logs
- **Delete confirmation** — custom modal prevents accidental deletions
- **Notes field** — optional notes per log entry for blockers or progress updates

### Filtering & Search
- Search by OTI ID, title, or assignee
- Filter by status, priority, assignee, year, and month
- Sort by last logged, most hours, or least hours
- Active filter count badge

### Data Import / Export
- **Import** — drag and drop or browse for `.xlsx`, `.xls`, or `.csv`
- **Smart column mapping** — recognises common column name variations automatically
- **Warning system** — flags rows with data issues without skipping them
- **Export** — downloads current filtered view as a timestamped CSV

### Views
- **OTIs tab** — all active OTIs sorted by last logged
- **Weekly summary** — logs grouped by work week with month filter
- **Assignee workload** — per-person breakdown showing OTIs, status, days worked, and last logged

### Priority Levels
| Level | Colour | Indicator |
|-------|--------|-----------|
| Low | Green | — |
| Medium | Amber | — |
| High | Red | — |
| XXL | Orange-red | — |
| Critical | Deep red | Pulsing badge |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 |
| Build tool | Vite 4 |
| Styling | Custom CSS with CSS variables + glassmorphism |
| Excel parsing | SheetJS (xlsx) |
| Data persistence | localStorage |
| Deployment | GitHub Pages via GitHub Actions |
| CI/CD | GitHub Actions (auto-deploy on push to main) |

---

## 📁 Project Structure

```
OTI-Tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-build and deploy pipeline
├── src/
│   ├── App.jsx                 # Root component and state management
│   ├── constants.js            # All config values, options, default states
│   ├── utils.js                # All utility functions (calc, filter, storage, export)
│   ├── index.css               # Global styles with CSS variables
│   ├── main.jsx                # React entry point
│   └── components/
│       ├── TopBar.jsx          # Fixed navigation header
│       ├── Dashboard.jsx       # Overview metrics and flip cards
│       ├── Filters.jsx         # Search and filter controls
│       ├── AddEntryForm.jsx    # Collapsible log entry form
│       ├── OTICard.jsx         # Individual OTI card with inline edit
│       ├── WeeklyView.jsx      # Weekly grouped summary table
│       ├── WorkloadView.jsx    # Per-assignee workload table
│       ├── ImportModal.jsx     # Two-stage CSV/Excel import flow
│       └── Toast.jsx           # Auto-dismissing notification
├── index.html
├── package.json
└── vite.config.js
```

---

## 🗂 Data Model

Each log entry follows this structure:

```json
{
  "id":        "log-001",
  "otiId":     "OTI-10023",
  "title":     "Update authentication flow",
  "createdBy": "Alex",
  "assignee":  "Jordan",
  "status":    "In Progress",
  "priority":  "High",
  "date":      "2026-05-08",
  "startTime": "09:00",
  "endTime":   "17:00",
  "hours":     8,
  "notes":     ""
}
```

---

## 📥 Import Format

The dashboard accepts `.xlsx`, `.xls`, and `.csv` files. Column names are matched automatically — common variations are handled. For best results use the template format:

| Column | Format | Example |
|--------|--------|---------|
| OTI ID | OTI-XXXXX | OTI-10023 |
| Title | Free text | Update auth flow |
| Created By | Name | Alex |
| Assignee | Name | Jordan |
| Status | Dropdown | In Progress |
| Priority | Dropdown | High |
| Date | YYYY-MM-DD | 2026-05-08 |
| Start Time | HH:MM (24hr) | 09:00 |
| End Time | HH:MM (24hr) | 17:00 |
| Hours | Decimal | 8.0 |
| Notes | Free text | Optional |

---

## 🚀 Getting Started

### Link For Web Application
https://sreya-kambhatla.github.io/OTI-Tracker/

### Prerequisites
- Node.js 18+
- npm

### Local Development
```bash
git clone https://sreya-kambhatla.github.io/OTI-Tracker.git
cd oti-tracker
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Deploy
Push to `main` — GitHub Actions handles the build and deployment automatically.

---

## 📊 Sample Data

A dummy dataset (`sample_data.csv`) is included in the repo to demo the dashboard without real data. Import it via the **Import CSV** button on the dashboard.

---

## 🗺 Roadmap

| Feature | Status |
|---------|--------|
| Core dashboard + import/export | ✅ Complete |
| Inline editing + delete confirmation | ✅ Complete |
| Weekly summary + assignee workload | ✅ Complete |
| 5-level priority with Critical indicator | ✅ Complete |
| Glassmorphism UI | ✅ Complete |
| Excel Online two-way sync | 🔜 Planned |
| Role-based views (team lead vs member) | 🔜 Planned |
| Email digest / weekly report export | 🔜 Planned |

---

## 👩‍💼 About This Project

This project was built as a complete business analyst portfolio piece demonstrating:

- **Requirements elicitation** — identifying pain points in an existing workflow
- **Process mapping** — documenting as-is and to-be states
- **Stakeholder communication** — translating business needs into technical requirements
- **End-to-end delivery** — from problem statement to deployed product
- **Technical implementation** — React, Vite, SheetJS, GitHub Actions CI/CD

---

*Built with React + Vite. Deployed on GitHub Pages.*
