"use client";

// Highest / Average / Lowest for the selected range — the three stat cards from
// GuardParent's Report screen (app/report.js). Android always renders all
// three, defaulting to 0% with no mood data, and doesn't color-code the value
// by mood — so neither does this.
//
// Highest and lowest are per-ENTRY, not per-day average: a single very bad
// check-in is the thing a parent needs to see, and averaging it into its day
// can hide it completely.

import { entryScore } from "../../../lib/mood";

export function MoodRangeStats({ entries }) {
  const scores = (entries ?? []).map(entryScore).filter((s) => s !== null);

  const highest = scores.length ? Math.max(...scores) : 0;
  const lowest = scores.length ? Math.min(...scores) : 0;
  const average = scores.length
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length
    : 0;

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
          className="flex flex-col items-center gap-0.5 rounded-xl bg-[var(--surface-muted)] px-2 py-2"
        >
          <span className="text-[18px] font-bold leading-none text-[var(--foreground)]">
            {Math.round(cell.value)}%
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}
