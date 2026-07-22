"use client";

// Screen-time breakdown for a date range — the "Screen Time Report" section of
// GuardParent's Report screen (app/report.js), minus its behaviour of filling in
// hardcoded Instagram/Discord/TikTok figures whenever the query comes back
// empty. Invented usage is worse than no usage.

import { aggregateApps, formatDuration, totalSeconds } from "../../lib/screenTime";

// Enough colors for the row dots; reused cyclically past the end.
const DOT_COLORS = [
  "#3399DB",
  "#8B5CF6",
  "#2ECC71",
  "#F39C12",
  "#E74C3C",
  "#14B8A6",
  "#EC4899",
  "#64748B",
];

export function ScreenTimeReport({ entries, days }) {
  const rows = Array.isArray(entries) ? entries : [];
  const apps = aggregateApps(rows);
  const total = totalSeconds(rows);

  if (!rows.length || apps.length === 0) {
    return (
      <p className="py-2 text-[13px] text-[var(--muted)]">
        No screen-time syncs in this period.
      </p>
    );
  }

  // Days that actually reported, not the length of the window — dividing by the
  // window would quietly understate a child who only syncs a few days a week.
  const syncedDays = new Set(
    rows
      .map((r) => r.dateString || r.createdAt?.toDate?.()?.toDateString())
      .filter(Boolean),
  ).size;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[22px] font-bold leading-none text-[var(--foreground)]">
          {formatDuration(total)}
        </span>
        <span className="text-[11.5px] text-[var(--muted)]">
          {syncedDays > 0 && (
            <>
              {formatDuration(total / syncedDays)}/day ·{" "}
              {syncedDays} of {days} days synced
            </>
          )}
        </span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {apps.map((app, i) => (
          <li key={app.key} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--foreground)]">
              {app.appName}
            </span>
            <span className="flex-shrink-0 text-[11.5px] text-[var(--muted)]">
              {Math.round(app.percentage)}%
            </span>
            <span className="w-16 flex-shrink-0 text-right text-[11.5px] font-medium text-[var(--foreground)]">
              {formatDuration(app.timeSpent)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
