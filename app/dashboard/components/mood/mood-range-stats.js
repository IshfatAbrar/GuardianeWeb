"use client";

// Highest / Average / Lowest for the selected range — the three stat cards from
// GuardParent's Report screen (app/report.js).
//
// Highest and lowest are per-ENTRY, not per-day average: a single very bad
// check-in is the thing a parent needs to see, and averaging it into its day
// can hide it completely.

import { entryScore, scoreColor } from "../../../lib/mood";

export function MoodRangeStats({ entries }) {
  const scores = (entries ?? []).map(entryScore).filter((s) => s !== null);
  if (!scores.length) return null;

  const highest = Math.max(...scores);
  const lowest = Math.min(...scores);
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  const cells = [
    { label: "Highest", value: highest },
    { label: "Average", value: average },
    { label: "Lowest", value: lowest },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center gap-1 rounded-xl bg-[var(--surface-muted)] px-2 py-3"
        >
          <span
            className="text-[22px] font-bold leading-none"
            style={{ color: scoreColor(cell.value) }}
          >
            {Math.round(cell.value)}
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
