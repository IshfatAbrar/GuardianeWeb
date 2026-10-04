"use client";

// Per-app screen-time breakdown for the report page: one row per app with a
// share bar. Takes `aggregateApps(...)` output. Never fills in invented usage
// when there's no data (GuardParent did) — invented usage is worse than none.

import { formatDuration } from "../../lib/screenTime";

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

export function ScreenTimeReport({ apps }) {
  if (!apps?.length) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
        <p className="text-[13.5px] font-semibold text-[var(--foreground)]">
          No screen time synced
        </p>
        <p className="max-w-sm text-[12.5px] leading-relaxed text-[var(--muted)]">
          Usage shows up here once the child&apos;s Android app syncs. iPhones
          don&apos;t share per-app usage.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {apps.map((app, i) => {
        const color = DOT_COLORS[i % DOT_COLORS.length];
        return (
          <li key={app.key} className="space-y-1.5">
            <div className="flex items-center gap-2.5 text-[13px]">
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--foreground)]">
                {app.appName}
              </span>
              <span className="text-[12px] text-[var(--muted)]">
                {Math.round(app.percentage)}%
              </span>
              <span className="w-16 text-right font-semibold text-[var(--foreground)]">
                {formatDuration(app.timeSpent)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, Math.min(100, app.percentage))}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
