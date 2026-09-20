import { JojoAvatar } from "../../../components/jojo-avatar";

export function JojoBanner({ onTalk, onLearnMore }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--accent-bg)] p-3.5 sm:p-4">
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Avatar. The blob's viewBox has empty margin around the triangle
            (most of it below), so pull the box in to trim the dead space. */}
        <div className="flex-shrink-0" style={{ margin: "-12px -12px -30px" }}>
          <JojoAvatar size={144} follow />
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
  );
}
