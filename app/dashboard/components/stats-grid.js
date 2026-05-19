const stats = [
  { label: 'Children monitored', value: '3',   sub: 'All active today',  danger: false },
  { label: 'Active alerts',      value: '1',   sub: 'Needs review',      danger: true  },
  { label: 'Avg wellbeing',      value: '72%', sub: '↑ 4% this week',    danger: false },
  { label: 'Modules done',       value: '7',   sub: '2 in progress',     danger: false },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{s.label}</p>
          {/* BLUE: stat card value (non-danger) — text var(--accent) */}
          <p className={`mt-2 text-3xl font-semibold leading-none tracking-tight ${s.danger ? 'text-[var(--danger)]' : 'text-[var(--accent)]'}`}>{s.value}</p>
          <p className="mt-1.5 text-[10px] text-[var(--muted)]">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}
