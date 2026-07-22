// Mood colors / emoji / labels and analytics.
//
// The child app (Guardiane_Android, MoodService) writes `mood_entries` rows
// holding a single wellbeing SCORE from 0–100 (higher is better), derived from
// a four-part survey it keeps in `responses` { emotional, energy, stress,
// outlook }. There is no emotion label on the entry.
//
// This replaces the web's previous model, which assumed the child picked one of
// six emotions (happy/calm/neutral/sad/anxious/angry) scored 1–6. That model
// came from the SwiftUI apps and has no counterpart in the Android schema —
// nothing writes a `mood` string to this project. A 0–100 wellbeing score can't
// be honestly reconstituted into "angry" vs "anxious", so instead of inventing
// an emotion we band the score. The charts are unchanged: they only need a
// categorical key plus a color, which a band provides.

// Band keys, best → worst. `distribution()` and friends emit these.
export const MOOD_BANDS = ["great", "good", "okay", "low", "struggling"];

// Inclusive lower bound for each band, checked high → low.
const BAND_MIN = {
  great: 80,
  good: 60,
  okay: 40,
  low: 20,
  struggling: 0,
};

const COLOR = {
  great: "#2ECC71",
  good: "#3399DB",
  okay: "#95A5A6",
  low: "#F39C12",
  struggling: "#E74C3C",
};

const EMOJI = {
  great: "😄",
  good: "🙂",
  okay: "😐",
  low: "😟",
  struggling: "😞",
};

const LABEL = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  low: "Low",
  struggling: "Struggling",
};

/** Clamp anything to a 0–100 score, or null when it isn't a usable number. */
function clampScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, value));
}

/** The 0–100 score on a mood_entries doc, or null if absent/malformed. */
export function entryScore(entry) {
  return clampScore(entry?.score);
}

/** Band key for a 0–100 score. Unknown scores band as "okay". */
export function moodBand(score) {
  const s = clampScore(score);
  if (s === null) return "okay";
  return MOOD_BANDS.find((band) => s >= BAND_MIN[band]) ?? "okay";
}

/** Band key for a mood_entries doc, or null when it carries no score. */
export function entryBand(entry) {
  const s = entryScore(entry);
  return s === null ? null : moodBand(s);
}

export function moodColor(band) {
  return COLOR[band] ?? COLOR.okay;
}

export function moodEmoji(band) {
  return EMOJI[band] ?? "🙂";
}

export function moodLabel(band) {
  return LABEL[band] ?? "—";
}

/** Color for a raw 0–100 score (used by the day-by-day timeline). */
export function scoreColor(score) {
  return moodColor(moodBand(score));
}

function entryMillis(entry) {
  const ms = entry?.timestamp?.toMillis?.() ?? entry?.createdAt?.toMillis?.();
  if (typeof ms === "number") return ms;
  if (entry?.timestamp instanceof Date) return entry.timestamp.getTime();
  return null;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

/** Mean 0–100 score across entries that have one. 0 when there are none. */
export function averageScore(entries) {
  const scores = entries.map(entryScore).filter((s) => s !== null);
  if (!scores.length) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * [{ mood, count }] sorted by count descending, where `mood` is a band key.
 * The key stays named `mood` so the chart components need no changes.
 */
export function distribution(entries) {
  const counts = new Map();
  for (const e of entries) {
    const band = entryBand(e);
    if (!band) continue;
    counts.set(band, (counts.get(band) || 0) + 1);
  }
  return Array.from(counts, ([mood, count]) => ({ mood, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export function mostFrequentMood(entries) {
  return distribution(entries)[0]?.mood ?? null;
}

/** [{ date, score }] — average 0–100 score per calendar day, ascending. */
export function dailyAverages(entries) {
  const byDay = new Map();
  for (const e of entries) {
    const ms = entryMillis(e);
    const score = entryScore(e);
    if (ms == null || score === null) continue;
    const day = new Date(ms);
    day.setHours(0, 0, 0, 0);
    const key = day.getTime();
    if (!byDay.has(key)) byDay.set(key, { total: 0, count: 0 });
    const slot = byDay.get(key);
    slot.total += score;
    slot.count += 1;
  }
  return Array.from(byDay, ([key, { total, count }]) => ({
    date: new Date(key),
    score: total / count,
  })).sort((a, b) => a.date - b.date);
}

// A shift worth calling a trend: 10 points on the 0–100 scale. That's 10% of
// the range, matching the sensitivity of the old 1–6 model's 0.5 threshold.
const TREND_THRESHOLD = 10;

/** "Improving" | "Declining" | "Stable" — compares first vs second half of days. */
export function trend(entries) {
  const averages = dailyAverages(entries);
  if (averages.length < 2) return "Stable";
  const mid = Math.floor(averages.length / 2);
  const avg = (arr) => arr.reduce((s, x) => s + x.score, 0) / arr.length;
  const first = avg(averages.slice(0, mid));
  const second = avg(averages.slice(mid));
  if (second - first > TREND_THRESHOLD) return "Improving";
  if (first - second > TREND_THRESHOLD) return "Declining";
  return "Stable";
}

// ─── Overview tiles ──────────────────────────────────────────────────────────

// How far back "recent" reaches for the average, and how many entries to fall
// back to when that window is empty.
const WELLBEING_WINDOW_DAYS = 7;
const WELLBEING_FALLBACK_ENTRIES = 10;

/**
 * What the overview's mood tiles show, from a child's full mood history.
 *
 * The child app logs a mood when it feels like it, not daily — live histories
 * routinely have month-wide gaps. GuardParent's home screen therefore shows the
 * child's LATEST entry regardless of age (`getLatestChildMood`), and this does
 * the same, but carries the entry's age so the UI can say when it is stale
 * rather than passing a five-week-old score off as today's. (GuardParent also
 * falls back to a hardcoded 89 when a child has no entries at all — that part
 * is deliberately not copied: an invented score is worse than an empty tile.)
 *
 * The average works the same way: the last `windowDays`, or — when the child
 * logged nothing in that window — their most recent handful of entries, with
 * `average.since` naming the period so the tile can label what it averaged.
 *
 * @param rows mood_entries docs, any order.
 * @returns {{
 *   latest: object|null, latestIsToday: boolean, latestAt: Date|null,
 *   average: { score: number, days: number|null, count: number, since: Date|null }|null,
 * }}
 */
export function summarizeMood(rows, { windowDays = WELLBEING_WINDOW_DAYS, now = Date.now() } = {}) {
  const scored = (Array.isArray(rows) ? rows : [])
    .filter((r) => entryScore(r) !== null)
    .map((r) => ({ row: r, ms: entryMillis(r) }))
    .sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0));

  if (!scored.length) {
    return { latest: null, latestIsToday: false, latestAt: null, average: null };
  }

  const latest = scored[0];
  const today = new Date(now).toDateString();
  // Prefer the child app's own `dateString` — it is stamped from the child's
  // clock, so a device a timezone away still agrees about which day it is.
  const latestIsToday = latest.row.dateString
    ? latest.row.dateString === today
    : latest.ms !== null && new Date(latest.ms).toDateString() === today;

  const cutoff = now - windowDays * 86_400_000;
  const inWindow = scored.filter((s) => s.ms !== null && s.ms >= cutoff);
  const used = inWindow.length ? inWindow : scored.slice(0, WELLBEING_FALLBACK_ENTRIES);
  const oldest = used[used.length - 1];

  return {
    latest: latest.row,
    latestIsToday,
    latestAt: latest.ms === null ? null : new Date(latest.ms),
    average: {
      score: Math.round(averageScore(used.map((s) => s.row))),
      days: inWindow.length ? windowDays : null,
      count: used.length,
      since: oldest.ms === null ? null : new Date(oldest.ms),
    },
  };
}
