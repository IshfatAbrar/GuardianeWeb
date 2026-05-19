export function PlaceholderTab({ title, subtitle }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      <div className="rounded-sm border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--surface-muted)]">
          <svg width="20" height="20" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title} coming soon</p>
        <p className="mt-1 text-[11px] text-[var(--muted)]">This section is under development.</p>
      </div>
    </div>
  )
}
