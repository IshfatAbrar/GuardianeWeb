export function StatsGrid({
  childrenCount = 0,
  activeAlertsCount = 0,
  completedCount = 0,
  inProgressCount = 0,
}) {
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
      value: '—',
      sub: 'Needs more data',
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
