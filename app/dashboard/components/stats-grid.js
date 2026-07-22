import { moodBand, moodLabel } from '../../lib/mood'

/**
 * `wellbeing` is `summarizeMood(...).average` for the selected child: the mean
 * 0–100 score over the last `days`, or — when they logged nothing that recently
 * — over their most recent `count` entries `since` a date. Null when they have
 * logged nothing at all, in which case the tile shows a dash rather than a zero,
 * which would read as a child in crisis instead of a child with no data.
 */
export function StatsGrid({
  childrenCount = 0,
  activeAlertsCount = 0,
  completedCount = 0,
  inProgressCount = 0,
  wellbeing = null,
  wellbeingChildName = null,
}) {
  const childFirst = wellbeingChildName?.split(' ')[0]
  const period = !wellbeing
    ? null
    : wellbeing.days
      ? `${wellbeing.days} days`
      : wellbeing.since
        ? `since ${wellbeing.since.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : `last ${wellbeing.count} entries`
  const stats = [
    {
      label: 'Children monitored',
      value: String(childrenCount),
      sub: childrenCount === 0 ? 'Add your first child' : 'All active today',
      danger: false,
    },
    {
      label: 'Active alerts',
      value: String(activeAlertsCount),
      sub: activeAlertsCount === 0 ? 'All clear' : 'Needs review',
      danger: activeAlertsCount > 0,
    },
    {
      label: 'Avg wellbeing',
      value: wellbeing ? String(wellbeing.score) : '—',
      sub: wellbeing
        ? `${moodLabel(moodBand(wellbeing.score))}${childFirst ? ` · ${childFirst}` : ''}, ${period}`
        : 'Needs more data',
      danger: false,
    },
    {
      label: 'Modules done',
      value: String(completedCount),
      sub: inProgressCount > 0 ? `${inProgressCount} in progress` : 'None in progress',
      danger: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            {s.label}
          </p>
          <p
            className={`mt-2 text-3xl font-semibold leading-none tracking-tight ${
              s.danger ? 'text-[var(--danger)]' : 'text-[var(--accent)]'
            }`}
          >
            {s.value}
          </p>
          <p className="mt-1.5 text-[10px] text-[var(--muted)]">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
