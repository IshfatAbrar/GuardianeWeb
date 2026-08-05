export function JojoBanner({ onTalk, onLearnMore }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3.5 sm:p-4">
      {/* Decorative blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-14 h-60 w-60 rounded-full bg-[var(--accent)] opacity-10 blur-2xl"
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Avatar */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30 sm:h-12 sm:w-12">
          <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        {/* Copy */}
        <div className="flex-1">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[var(--accent)]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Available 24/7
          </div>

          <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
            Hello, I&apos;m JoJo — your AI assistant
          </h2>

          <p className="mt-1 text-xs font-medium text-[var(--foreground)]">
            JoJo Chat: 24/7 Private Support for Families Navigating Teen Safety,
            Mental Health, and Digital Well-Being.
          </p>

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onTalk}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5"
            >
              Talk to JoJo
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={onLearnMore}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-border)] bg-transparent px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)] transition-colors hover:bg-[var(--accent-bg-hover)]"
            >
              How JoJo helps
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
