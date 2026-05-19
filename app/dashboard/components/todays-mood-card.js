export function TodaysMoodCard() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg width="18" height="18" style={{ fill: 'var(--accent)' }} viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">Today&apos;s Mood</h2>
      </div>
      <div className="flex-1 rounded-2xl bg-[var(--surface-muted)] flex flex-col items-center justify-center py-6 gap-2">
        <svg width="32" height="32" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-[13px] text-[var(--muted)] font-medium">No Data</span>
      </div>
      <button className="w-full rounded-xl bg-[var(--accent-bg)] py-2.5 text-[13px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-bg-hover)] transition-colors">
        Full Report
      </button>
    </div>
  )
}
