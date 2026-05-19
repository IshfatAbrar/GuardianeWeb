export function RecentActivityCard() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg width="18" height="18" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">Recent Activity</h2>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] flex items-center justify-center">
          <svg width="20" height="20" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-[14px] text-[var(--muted)]">No recent alerts</p>
      </div>
    </div>
  )
}
