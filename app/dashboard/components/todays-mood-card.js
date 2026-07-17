import { entryScore, entryBand, moodEmoji, moodLabel, moodColor } from '../../lib/mood'

// A mood_entries row carries a 0–100 wellbeing score, not an emotion name, so
// show the score and the band it falls in. Returns null when the child hasn't
// logged today, or logged a row with no usable score.
function moodMeta(mood) {
  if (!mood) return null
  const score = entryScore(mood)
  const band = entryBand(mood)
  if (score === null || !band) return null
  return {
    emoji: moodEmoji(band),
    label: moodLabel(band),
    color: moodColor(band),
    score: Math.round(score),
  }
}

export function TodaysMoodCard({ mood, childName, onFullReport }) {
  const meta = moodMeta(mood)
  const childFirst = childName?.split(' ')[0]

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
        {meta ? (
          <>
            <span className="text-4xl" aria-hidden>{meta.emoji}</span>
            <span className="text-[14px] font-semibold" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-[12px] font-medium text-[var(--muted)]">
              {meta.score}/100
            </span>
            {childFirst && (
              <span className="text-[11px] text-[var(--muted)]">{childFirst}</span>
            )}
          </>
        ) : (
          <>
            <svg width="32" height="32" fill="none" style={{ stroke: 'var(--muted)' }} strokeWidth="1.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" strokeLinecap="round" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[13px] text-[var(--muted)] font-medium">
              {childFirst ? `No mood logged for ${childFirst}` : 'No Data'}
            </span>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onFullReport}
        className="w-full rounded-xl bg-[var(--accent-bg)] py-2.5 text-[13px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-bg-hover)] transition-colors"
      >
        Full Report
      </button>
    </div>
  )
}
