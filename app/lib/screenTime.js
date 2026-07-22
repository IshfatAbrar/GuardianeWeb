// Screen-time formatting and roll-ups over `screen_time_entries`.
//
// The child app (Guardiane_Android, ScreenTimeService) writes one row per sync
// and REPLACES the current day's row each time (delete + re-add), so a row is a
// cumulative day rather than a delta. That is what makes summing rows across a
// range correct: each day contributes exactly once.
//
// All durations are SECONDS — `totalScreenTime` on the row and `timeSpent` on
// each app entry alike.

/** "2h 15m" / "45m" / "0m" from a duration in seconds. */
export function formatDuration(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return '0m'
  const hours = Math.floor(total / 3600)
  const minutes = Math.round((total % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

/** Total seconds across entries, preferring the row total over re-adding apps. */
export function totalSeconds(entries) {
  const rows = Array.isArray(entries) ? entries : []
  return rows.reduce((sum, row) => {
    const explicit = Number(row?.totalScreenTime)
    if (Number.isFinite(explicit) && explicit > 0) return sum + explicit
    // No usable total: fall back to the app breakdown so the row still counts.
    const apps = Array.isArray(row?.allApps) ? row.allApps : []
    return sum + apps.reduce((s, a) => s + (Number(a?.timeSpent) || 0), 0)
  }, 0)
}

/**
 * Per-app totals across every entry, biggest first:
 *   [{ key, appName, packageName, timeSpent, percentage }]
 *
 * Apps are keyed by packageName where present — two rows can spell the same
 * app's display name differently, and `percentage` on the row is per-day, so it
 * cannot be averaged across a range and is recomputed here from the totals.
 */
export function aggregateApps(entries, limit = 8) {
  const rows = Array.isArray(entries) ? entries : []
  const byApp = new Map()

  for (const row of rows) {
    // `allApps` is the complete set; `topApps` is the child app's pre-truncated
    // view of the same data, so it is only a fallback when allApps is absent.
    const apps = Array.isArray(row?.allApps) && row.allApps.length > 0
      ? row.allApps
      : Array.isArray(row?.topApps)
        ? row.topApps
        : []

    for (const app of apps) {
      const spent = Number(app?.timeSpent)
      if (!Number.isFinite(spent) || spent <= 0) continue
      const key = app.packageName || app.appName
      if (!key) continue
      const slot = byApp.get(key)
      if (slot) {
        slot.timeSpent += spent
      } else {
        byApp.set(key, {
          key,
          appName: app.appName || app.packageName || 'Unknown',
          packageName: app.packageName || null,
          timeSpent: spent,
        })
      }
    }
  }

  const list = Array.from(byApp.values()).sort((a, b) => b.timeSpent - a.timeSpent)
  const total = list.reduce((sum, a) => sum + a.timeSpent, 0)
  return list.slice(0, limit).map((a) => ({
    ...a,
    percentage: total > 0 ? (a.timeSpent / total) * 100 : 0,
  }))
}
