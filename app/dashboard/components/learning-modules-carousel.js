import { moduleColors } from "../data/modules";

// Collapse modules that share a title (case-insensitive, trimmed) so the
// carousel doesn't show the same card twice when Firestore has duplicates.
function dedupeByTitle(modules) {
  const seen = new Set()
  const out = []
  for (const m of modules) {
    const key = String(m.title || m.name || '').trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }
  return out
}

export function LearningModulesCarousel({ modules = [], onViewAll, onSelectModule }) {
  const unique = dedupeByTitle(modules)
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg
            width="18"
            height="18"
            fill="none"
            style={{ stroke: "var(--accent)" }}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          Learning Modules
        </h2>
        <button
          type="button"
          onClick={onViewAll}
          className="ml-auto text-[13px] font-semibold text-[var(--accent)] bg-[var(--accent-bg)] px-3 py-1 rounded-lg hover:bg-[var(--accent-bg-hover)] transition-colors"
        >
          View All
        </button>
      </div>

      {unique.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[13px] text-[var(--muted)]">
            No modules yet. Modules created in the iOS app will appear here.
          </p>
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {unique.map((mod, i) => {
            const color = moduleColors[i % moduleColors.length];
            const title = mod.title || mod.name || 'Untitled module';
            const meta = [mod.ageGroup, mod.difficulty].filter(Boolean).join(' · ');
            const duration = mod.estimatedDuration ? `${mod.estimatedDuration}m` : null;
            return (
              <div
                key={mod.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectModule?.(mod)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectModule?.(mod);
                  }
                }}
                className="flex-shrink-0 w-[200px] rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: color.bg }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  {mod.difficulty && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider text-white px-2 py-0.5 rounded-full"
                      style={{ background: color.badge }}
                    >
                      {mod.difficulty}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[16px] font-bold text-white leading-tight line-clamp-2">
                    {title}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-1">
                  {duration ? (
                    <span className="text-[11px] font-semibold text-white opacity-90">{duration}</span>
                  ) : (
                    <span />
                  )}
                  {mod.isActive === false && (
                    <span className="text-[10px] font-semibold text-white opacity-70 uppercase tracking-wider">
                      Draft
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
