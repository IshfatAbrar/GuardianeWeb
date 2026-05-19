export function JojoBanner() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent-bg)] px-4 py-3.5">
      {/* BLUE: Jojo avatar circle — solid blue var(--accent) to match dashboard palette */}
      <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--foreground)]">Hello, I&apos;m Jojo your AI assistant.</p>
        <p className="text-[12px] text-[var(--muted)]">Come talk to me!</p>
      </div>
    </div>
  )
}
