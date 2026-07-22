// Unit tests for the pure mood helpers/analytics in mood.js.
//
// These double as a schema guard against the Android child app: it writes
// mood_entries rows carrying a 0–100 `score` and no emotion label, so anything
// here that starts depending on a `mood` string is reading a field that does
// not exist in this project.
import { describe, it, expect } from "vitest";
import {
  MOOD_BANDS,
  entryScore,
  entryBand,
  moodBand,
  moodColor,
  moodEmoji,
  moodLabel,
  averageScore,
  distribution,
  mostFrequentMood,
  dailyAverages,
  trend,
  scoreColor,
  summarizeMood,
} from "./mood.js";

// A mood_entries-shaped doc. entryMillis accepts a plain Date.
const entry = (score, date) => ({ score, timestamp: date });

describe("entryScore", () => {
  it("reads the 0–100 score off an entry", () => {
    expect(entryScore({ score: 72 })).toBe(72);
    expect(entryScore({ score: 0 })).toBe(0);
  });

  it("clamps out-of-range scores into 0–100", () => {
    expect(entryScore({ score: 140 })).toBe(100);
    expect(entryScore({ score: -20 })).toBe(0);
  });

  it("returns null when there is no usable score", () => {
    expect(entryScore({})).toBeNull();
    expect(entryScore(null)).toBeNull();
    expect(entryScore({ score: "80" })).toBeNull();
    expect(entryScore({ score: NaN })).toBeNull();
  });

  it("ignores a legacy emotion label — this project has no such field", () => {
    expect(entryScore({ mood: "happy" })).toBeNull();
  });
});

describe("moodBand", () => {
  it("bands each score range", () => {
    expect(moodBand(95)).toBe("great");
    expect(moodBand(70)).toBe("good");
    expect(moodBand(50)).toBe("okay");
    expect(moodBand(30)).toBe("low");
    expect(moodBand(5)).toBe("struggling");
  });

  it("puts each boundary in the higher band", () => {
    expect(moodBand(80)).toBe("great");
    expect(moodBand(79)).toBe("good");
    expect(moodBand(60)).toBe("good");
    expect(moodBand(59)).toBe("okay");
    expect(moodBand(40)).toBe("okay");
    expect(moodBand(39)).toBe("low");
    expect(moodBand(20)).toBe("low");
    expect(moodBand(19)).toBe("struggling");
    expect(moodBand(0)).toBe("struggling");
  });

  it("falls back to okay for unusable input", () => {
    expect(moodBand(undefined)).toBe("okay");
    expect(moodBand("70")).toBe("okay");
  });

  it("has a color, emoji and label for every band", () => {
    for (const band of MOOD_BANDS) {
      expect(moodColor(band)).toMatch(/^#[0-9A-F]{6}$/i);
      expect(moodEmoji(band)).toBeTruthy();
      expect(moodLabel(band)).toBeTruthy();
      expect(moodLabel(band)).not.toBe("—");
    }
  });

  it("scoreColor agrees with the band's color", () => {
    expect(scoreColor(95)).toBe(moodColor("great"));
    expect(scoreColor(5)).toBe(moodColor("struggling"));
  });
});

describe("entryBand", () => {
  it("bands an entry by its score", () => {
    expect(entryBand({ score: 85 })).toBe("great");
    expect(entryBand({ score: 10 })).toBe("struggling");
  });

  it("is null when the entry has no score, rather than banding it as okay", () => {
    expect(entryBand({})).toBeNull();
  });
});

describe("averageScore", () => {
  it("means the scores", () => {
    expect(averageScore([entry(80), entry(60)])).toBe(70);
  });

  it("is 0 for no entries", () => {
    expect(averageScore([])).toBe(0);
  });

  it("skips entries with no score instead of counting them as zero", () => {
    expect(averageScore([entry(80), {}, entry(60)])).toBe(70);
  });
});

describe("distribution", () => {
  const entries = [entry(90), entry(85), entry(65), entry(10)];

  it("counts entries per band, most frequent first", () => {
    expect(distribution(entries)).toEqual([
      { mood: "great", count: 2 },
      { mood: "good", count: 1 },
      { mood: "struggling", count: 1 },
    ]);
  });

  it("omits entries with no score", () => {
    expect(distribution([entry(90), {}])).toEqual([{ mood: "great", count: 1 }]);
  });

  it("mostFrequentMood picks the top band, and is null when empty", () => {
    expect(mostFrequentMood(entries)).toBe("great");
    expect(mostFrequentMood([])).toBeNull();
  });
});

describe("dailyAverages", () => {
  const day1 = new Date(2026, 0, 1, 9);
  const day1Later = new Date(2026, 0, 1, 21);
  const day2 = new Date(2026, 0, 2, 9);

  it("averages entries within a calendar day, ascending by date", () => {
    const result = dailyAverages([
      entry(60, day1Later),
      entry(80, day1),
      entry(30, day2),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(70);
    expect(result[1].score).toBe(30);
    expect(result[0].date.getTime()).toBeLessThan(result[1].date.getTime());
  });

  it("drops entries missing a timestamp or a score", () => {
    expect(dailyAverages([entry(80), { timestamp: day1 }])).toEqual([]);
  });
});

describe("trend", () => {
  const at = (dayOfMonth) => new Date(2026, 0, dayOfMonth, 9);

  it("is Stable with fewer than two days", () => {
    expect(trend([])).toBe("Stable");
    expect(trend([entry(90, at(1))])).toBe("Stable");
  });

  it("reports Improving when the second half gains more than 10 points", () => {
    expect(
      trend([entry(30, at(1)), entry(35, at(2)), entry(80, at(3)), entry(85, at(4))]),
    ).toBe("Improving");
  });

  it("reports Declining when the second half loses more than 10 points", () => {
    expect(
      trend([entry(85, at(1)), entry(80, at(2)), entry(35, at(3)), entry(30, at(4))]),
    ).toBe("Declining");
  });

  it("holds Stable for a shift of 10 points or less", () => {
    expect(trend([entry(50, at(1)), entry(60, at(2))])).toBe("Stable");
  });
});

describe("summarizeMood", () => {
  const NOW = new Date(2026, 6, 21, 12).getTime(); // Tue Jul 21 2026, midday
  const daysAgo = (n) => new Date(NOW - n * 86_400_000);
  const at = (n) => {
    const d = daysAgo(n);
    return { score: 60, timestamp: d, dateString: d.toDateString() };
  };
  const scored = (score, n) => ({ ...at(n), score });

  it("returns empty state when the child has never logged a mood", () => {
    expect(summarizeMood([], { now: NOW })).toEqual({
      latest: null,
      latestIsToday: false,
      latestAt: null,
      average: null,
    });
  });

  it("ignores rows that carry no usable score", () => {
    expect(summarizeMood([{ timestamp: daysAgo(0) }], { now: NOW }).latest).toBeNull();
  });

  // The whole point of the change: GuardParent shows the newest entry however
  // old it is, and the web now matches instead of blanking the tile.
  it("surfaces the newest entry even when it is weeks old", () => {
    const summary = summarizeMood([scored(77, 74), scored(92, 34)], { now: NOW });
    expect(summary.latest.score).toBe(92);
    expect(summary.latestIsToday).toBe(false);
    expect(summary.average.score).toBe(85); // (77 + 92) / 2
  });

  it("flags an entry logged today, trusting the child device's dateString", () => {
    const summary = summarizeMood([scored(80, 0)], { now: NOW });
    expect(summary.latestIsToday).toBe(true);
    expect(summary.average).toEqual({
      score: 80,
      days: 7,
      count: 1,
      since: summary.latestAt,
    });
  });

  it("does not call an entry today's when the child's own date disagrees", () => {
    const row = { score: 80, timestamp: daysAgo(0), dateString: "Mon Jul 20 2026" };
    expect(summarizeMood([row], { now: NOW }).latestIsToday).toBe(false);
  });

  it("averages only the window while the child is logging regularly", () => {
    const summary = summarizeMood([scored(40, 1), scored(60, 3), scored(90, 30)], {
      now: NOW,
    });
    expect(summary.average.score).toBe(50); // the 30-day-old 90 is excluded
    expect(summary.average.days).toBe(7);
    expect(summary.average.count).toBe(2);
  });

  it("falls back to recent entries, and says so, once the window is empty", () => {
    const summary = summarizeMood([scored(40, 20), scored(60, 40)], { now: NOW });
    expect(summary.average.score).toBe(50);
    expect(summary.average.days).toBeNull(); // → the tile labels it "since <date>"
    expect(summary.average.count).toBe(2);
    expect(summary.average.since).toEqual(daysAgo(40));
  });

  it("caps the fallback at the ten most recent entries", () => {
    // Twelve stale entries: the oldest two (score 0) must not drag the average.
    const rows = Array.from({ length: 12 }, (_, i) => scored(i < 10 ? 100 : 0, 30 + i));
    expect(summarizeMood(rows, { now: NOW }).average).toMatchObject({
      score: 100,
      count: 10,
    });
  });
});
