"use client";

// Today's screen time for the selected child.
//
// Source: `screen_time_entries`, written by Guardiane_Android's
// ScreenTimeService from Android usage stats. The child re-writes the day's row
// on each sync (delete + re-add), so the latest row is a cumulative total for
// that day, not a delta.
//
// Unlike GuardParent's home screen, this never substitutes mock data when the
// child hasn't synced — a parent seeing invented app usage is worse than a
// parent seeing "no data".

import { formatDuration } from "../../lib/screenTime";

const MAX_APPS = 4;

function syncedLabel(entry) {
  const date = entry?.createdAt?.toDate?.();
  if (!date) return null;
  const today = new Date().toDateString() === date.toDateString();
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return today
    ? `Synced ${time}`
    : `Last synced ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export function ScreenTimeCard({ entry, childName }) {
  const childFirst = childName?.split(" ")[0];

  // `topApps` is pre-sorted and pre-truncated by the child app; fall back to
  // allApps, which is every app and therefore needs sorting and slicing.
  const apps = (
    Array.isArray(entry?.topApps) && entry.topApps.length > 0
      ? entry.topApps
      : Array.isArray(entry?.allApps)
        ? [...entry.allApps].sort((a, b) => (b.timeSpent || 0) - (a.timeSpent || 0))
        : []
  ).slice(0, MAX_APPS);

  const maxSpent = apps.reduce((m, a) => Math.max(m, Number(a.timeSpent) || 0), 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-bg)]">
          <svg width="18" height="18" fill="none" style={{ stroke: "var(--accent)" }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">Screen Time</h2>
      </div>

      {!entry ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--surface-muted)] py-8">
          <svg width="28" height="28" fill="none" style={{ stroke: "var(--muted)" }} strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
          <span className="text-[13px] font-medium text-[var(--muted)]">
            {childFirst ? `No sync from ${childFirst}'s device` : "No Data"}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-bold leading-none text-[var(--foreground)]">
              {formatDuration(entry.totalScreenTime)}
            </span>
            {entry.appsUsed > 0 && (
              <span className="text-[12px] text-[var(--muted)]">
                across {entry.appsUsed} {entry.appsUsed === 1 ? "app" : "apps"}
              </span>
            )}
          </div>

          {apps.length > 0 && (
            <ul className="flex flex-col gap-2 pt-1">
              {apps.map((app) => (
                <li key={app.packageName || app.appName} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12.5px] font-medium text-[var(--foreground)]">
                      {app.appName || app.packageName || "Unknown"}
                    </span>
                    <span className="flex-shrink-0 text-[11.5px] text-[var(--muted)]">
                      {app.timeFormatted || formatDuration(app.timeSpent)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${maxSpent > 0 ? ((Number(app.timeSpent) || 0) / maxSpent) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {syncedLabel(entry) && (
            <p className="pt-1 text-[11px] text-[var(--muted)]">{syncedLabel(entry)}</p>
          )}
        </>
      )}
    </div>
  );
}
