import { entryScore, entryBand, moodEmoji, moodLabel, moodColor } from '../../lib/mood'

// A mood_entries row carries a 0–100 wellbeing score, not an emotion name, so
// show the score and the band it falls in. Returns null when there is no entry
// at all, or the newest one carries no usable score.
function moodMeta(entry) {
  if (!entry) return null
  const score = entryScore(entry)
  const band = entryBand(entry)
  if (score === null || !band) return null
  return {
    emoji: moodEmoji(band),
    label: moodLabel(band),
    color: moodColor(band),
    score: Math.round(score),
  }
}

const DAY_MS = 86_400_000

function midnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * "today" / "yesterday" / "3 days ago" / a date once that stops being useful.
 *
 * Counts calendar days, not elapsed hours: an entry logged at 11pm is
 * "yesterday" the next morning, not eight hours ago. A negative count means the
 * child's device is a timezone ahead of this browser — the closest true answer
 * there is still "today".
 */
function whenLabel(at, isToday) {
  if (isToday) return 'today'
  if (!(at instanceof Date)) return null
  const days = Math.round((midnight(new Date()) - midnight(at)) / DAY_MS)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * The child app logs a mood only when the child opens it, so demanding one
 * dated *today* left this card empty for weeks at a stretch. GuardParent's home
 * screen shows the latest entry however old it is; this does the same, but says
 * when it was logged instead of implying it is current.
 */
export function TodaysMoodCard({ mood, childName, onFullReport }) {
  const meta = moodMeta(mood?.latest)
  const childFirst = childName?.split(' ')[0]
  const when = meta ? whenLabel(mood?.latestAt, mood?.latestIsToday) : null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg width="18" height="18" style={{ fill: 'var(--accent)' }} viewBox="0 0 24 24">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          {mood?.latestIsToday ? "Today's Mood" : 'Latest Mood'}
        </h2>
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
            {(childFirst || when) && (
              <span className="text-[11px] text-[var(--muted)]">
                {[childFirst, when].filter(Boolean).join(' · ')}
              </span>
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
              {childFirst ? `${childFirst} hasn't logged a mood yet` : 'No Data'}
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
