export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.78rem] text-red-700">
      {msg}
    </div>
  );
}

export function StepCard({ title, sub, children }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {(title || sub) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-serif text-[1.5rem] font-normal leading-[1.15] tracking-tight text-[var(--foreground)]">
              {title}
            </h2>
          )}
          {sub && (
            <p className="mt-1 text-[0.82rem] text-[var(--muted)]">{sub}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function StepFooter({
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled = false,
}) {
  return (
    <div className="mt-8 flex items-center justify-between pt-2">
      {onBack ? (
        <button
          onClick={onBack}
          className="rounded border border-[var(--border)] bg-transparent px-4 py-2.5 font-sans text-[0.75rem] font-medium text-[var(--muted)] transition hover:bg-[var(--background)]"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded bg-[var(--accent)] px-5 py-2.5 font-sans text-[0.75rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  );
}
