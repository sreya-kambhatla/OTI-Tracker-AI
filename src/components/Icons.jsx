import React from 'react';

// ─── Action icons (14–16px) ──────────────────────────────────────────────────

export function UploadIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 10.5V3M5.5 5.5L8 3l2.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 11.5v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function DownloadIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M8 3v7.5M5.5 8L8 10.5 10.5 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 11.5v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  );
}

export function SettingsIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function EditIcon({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M9.5 2.5l2 2L4.5 12H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function TrashIcon({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M2.5 4h9M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 4l.7 7.5h6.6L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SparkleIcon({ size = 14, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
      <path d="M7 1l1.5 4L13 7l-4.5 2L7 13l-1.5-4L1 7l4.5-2L7 1z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  );
}

// ─── Empty state illustrations (72px) ────────────────────────────────────────

export function NoDataIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="20" y="13" width="38" height="50" rx="5" stroke="currentColor" strokeWidth="2"
        strokeOpacity="0.25" strokeDasharray="4 3"/>
      <rect x="13" y="20" width="38" height="48" rx="5" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M22 34h20M22 42h14M22 50h18" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeOpacity="0.45"/>
      <circle cx="54" cy="20" r="9" fill="var(--indigo)" fillOpacity="0.12"
        stroke="var(--indigo)" strokeWidth="1.8"/>
      <path d="M50 20h8M54 16v8" stroke="var(--indigo)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function NoResultsIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="31" cy="31" r="18" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M44 44l16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M25 25l12 12M37 25l-12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export function NoWeeksIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <rect x="8" y="18" width="56" height="48" rx="6" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M8 32h56" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4"/>
      <path d="M24 8v18M48 8v18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="23" cy="44" r="2.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="36" cy="44" r="2.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="49" cy="44" r="2.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="23" cy="56" r="2.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="36" cy="56" r="2.5" fill="currentColor" fillOpacity="0.2"/>
      <circle cx="49" cy="56" r="2.5" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  );
}

export function NoTeamIllustration() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
      <circle cx="36" cy="24" r="11" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M14 63c0-12.1 9.9-22 22-22s22 9.9 22 22" stroke="currentColor"
        strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="60" cy="22" r="7.5" stroke="currentColor" strokeWidth="2" strokeOpacity="0.4"/>
      <path d="M47 55c2-6 7.5-10.4 14-10.4" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4"/>
    </svg>
  );
}

// ─── EmptyState layout component ─────────────────────────────────────────────

export function EmptyState({ illustration, title, subtitle, action }) {
  return (
    <div className="card empty">
      <div className="empty-icon">{illustration}</div>
      <div className="empty-title">{title}</div>
      {subtitle && <div className="empty-text">{subtitle}</div>}
      {action && (
        <button className="btn" style={{ fontSize:13 }} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Navigation icons (16px) ─────────────────────────────────────────────────

export function ListIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="2.5" cy="4" r="1.1" fill="currentColor"/>
      <circle cx="2.5" cy="8" r="1.1" fill="currentColor"/>
      <circle cx="2.5" cy="12" r="1.1" fill="currentColor"/>
    </svg>
  );
}

export function CalendarIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ChartIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M2 12V7M6 12V4M10 12V9M14 12V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M1 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ResetIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path d="M3 8a5 5 0 105-5H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M3 4.5V8h3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AnalyticsIcon({ size = 16, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
