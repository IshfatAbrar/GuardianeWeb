// Unit tests for the pure mood helpers/analytics in mood.js.
// These are ported 1:1 from the iOS app, so the tests double as a parity guard:
// if web scoring/analytics ever drifts from iOS, these fail.
import { describe, it, expect } from "vitest";
import {
  moodScore,
  moodColor,
  moodEmoji,
  moodLabel,
  entryMood,
  averageScore,
  distribution,
  mostFrequentMood,
  dailyAverages,
  trend,
  scoreColor,
} from "./mood.js";

// Build a moodEntries-shaped doc with a Date timestamp (entryMillis handles Date).
const entry = (mood, date) => ({ mood, timestamp: date });

describe("scoring + display helpers", () => {
  it("scores moods on the iOS 1–6 scale", () => {
    expect(moodScore("happy")).toBe(6);
    expect(moodScore("calm")).toBe(5);
    expect(moodScore("neutral")).toBe(4);
    expect(moodScore("sad")).toBe(3);
    expect(moodScore("anxious")).toBe(2);
    expect(moodScore("angry")).toBe(1);
  });

  it("is case-insensitive and falls back to neutral (4) for unknown moods", () => {
    expect(moodScore("HAPPY")).toBe(6);
    expect(moodScore("banana")).toBe(4);
    expect(moodScore(undefined)).toBe(4);
  });

  it("returns the neutral grey color / generic emoji for unknown moods", () => {
    expect(moodColor("happy")).toBe("#2ECC71");
    expect(moodColor("banana")).toBe("#95A5A6");
    expect(moodEmoji("calm")).toBe("😌");
    expect(moodEmoji("banana")).toBe("🙂");
  });

  it("labels capitalize, with — for empty", () => {
    expect(moodLabel("sad")).toBe("Sad");
    expect(moodLabel("")).toBe("—");
  });

  it("reads the mood key from either `mood` or legacy `label`", () => {
    expect(entryMood({ mood: "Happy" })).toBe("happy");
    expect(entryMood({ label: "Sad" })).toBe("sad");
    expect(entryMood({})).toBe("");
  });
});

describe("analytics", () => {
  it("averageScore is 0 on empty and the mean otherwise", () => {
    expect(averageScore([])).toBe(0);
    // happy(6) + angry(1) => mean 3.5
    expect(averageScore([entry("happy"), entry("angry")])).toBe(3.5);
  });

  it("distribution counts moods and sorts by count descending", () => {
    const d = distribution([
      entry("happy"),
      entry("happy"),
      entry("sad"),
    ]);
    expect(d).toEqual([
      { mood: "happy", count: 2 },
      { mood: "sad", count: 1 },
    ]);
    expect(mostFrequentMood([entry("sad"), entry("sad"), entry("happy")])).toBe(
      "sad",
    );
    expect(mostFrequentMood([])).toBeNull();
  });

  it("dailyAverages groups entries by calendar day, ascending", () => {
    const day1 = new Date(2026, 0, 1, 9, 0);
    const day1pm = new Date(2026, 0, 1, 21, 0);
    const day2 = new Date(2026, 0, 2, 12, 0);
    const result = dailyAverages([
      entry("angry", day2), // intentionally out of order
      entry("happy", day1), // 6
      entry("neutral", day1pm), // 4  -> day1 avg = 5
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(5); // day1 first (ascending)
    expect(result[1].score).toBe(1); // day2 = angry
  });

  it("trend compares first vs second half of days", () => {
    const d = (n) => new Date(2026, 0, n, 12, 0);
    // first half low, second half high => Improving
    const improving = [
      entry("angry", d(1)),
      entry("angry", d(2)),
      entry("happy", d(3)),
      entry("happy", d(4)),
    ];
    expect(trend(improving)).toBe("Improving");
    expect(trend([entry("happy", d(1))])).toBe("Stable"); // <2 days
  });

  it("scoreColor buckets averaged daily scores", () => {
    expect(scoreColor(5.5)).toBe("#2ECC71");
    expect(scoreColor(4)).toBe("#3399DB");
    expect(scoreColor(3)).toBe("#95A5A6");
    expect(scoreColor(2)).toBe("#F39C12");
    expect(scoreColor(1)).toBe("#E74C3C");
  });
});
