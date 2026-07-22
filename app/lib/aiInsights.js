// AI insights — READ-ONLY on the web.
//
// GuardParent (the Android parent app) generates these: services/geminiService.js
// sends the child's mood score, mood note, top apps and recent risk alerts to
// Gemini, then caches the result at `aiInsights/{childId}` — one doc per child,
// overwritten at most once a day and guarded by a `date` field.
//
// The web reads that cache and never writes it. Generating here would mean a
// second client racing the phone for the same document and paying for a second
// Gemini call to produce an insight that is already sitting in Firestore. The
// cost of not generating is that a parent who only ever uses the web sees no
// insights — which the card says out loud rather than leaving blank.
//
// Doc shape (GuardParent/services/geminiService.js:118-123):
//   suggestedConversation — 2–3 sentences on what's happening with the child
//   conversationStarter   — one open-ended question, already in quotes
//   tip                   — one actionable parenting tip
//   mood_insight          — one sentence reading the mood score
//   date                  — "YYYY-MM-DD" in the PHONE's local time
//   childId, generatedAt  — serverTimestamp()
//
// Note `mood_insight` is snake_case while everything around it is camelCase.
// That is what Android writes; do not "fix" it here or the field stops resolving.

import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const COLLECTION = 'aiInsights'

// An insight older than this is dropped rather than shown. Yesterday's still has
// something useful to say about a child; last week's is about a day nobody
// remembers, and it reads as current because nothing on the card says otherwise.
const MAX_AGE_DAYS = 1

/** "YYYY-MM-DD" for a Date in LOCAL time — the format and clock Android uses. */
function localDateKey(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Whole days between two "YYYY-MM-DD" keys, or null if either won't parse. */
function dayGap(fromKey, toKey) {
  const from = Date.parse(`${fromKey}T00:00:00`)
  const to = Date.parse(`${toKey}T00:00:00`)
  if (Number.isNaN(from) || Number.isNaN(to)) return null
  return Math.round((to - from) / 86_400_000)
}

/**
 * The cached insight for a child, or null when there is none recent enough.
 *
 * Returns the doc plus `ageInDays` (0 = generated today) so the card can label a
 * carried-over insight honestly instead of passing it off as today's.
 */
export async function fetchInsightsForChild(childId) {
  if (!childId) return null
  const snap = await getDoc(doc(db, COLLECTION, childId))
  if (!snap.exists()) return null

  const data = snap.data()
  const age = typeof data.date === 'string' ? dayGap(data.date, localDateKey(new Date())) : null

  // No usable date means we can't tell how old it is — treat that as too old.
  if (age === null || age > MAX_AGE_DAYS) return null

  // A negative age is not a bug: `date` is the phone's local day, so a parent
  // whose phone is a timezone ahead of this browser writes tomorrow's date. That
  // insight is the freshest one there is, so floor the age rather than reject it.
  return { id: snap.id, ...data, ageInDays: Math.max(0, age) }
}

/** True when the doc carries at least one insight worth rendering. */
export function hasInsightContent(insights) {
  if (!insights) return false
  return ['suggestedConversation', 'conversationStarter', 'mood_insight', 'tip'].some(
    (key) => typeof insights[key] === 'string' && insights[key].trim().length > 0,
  )
}
