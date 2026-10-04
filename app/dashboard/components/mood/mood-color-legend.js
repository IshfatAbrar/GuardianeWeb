"use client";

// Legend for the mood donut: one row per band with its color, check-in count
// and share of the period.

import { moodColor, moodLabel } from "../../../lib/mood";

export function MoodColorLegend({ distribution }) {
  if (!distribution.length) return null;
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  return (
    <ul className="w-full divide-y divide-[var(--border)]">
      {distribution.map((item) => (
        <li
          key={item.mood}
          className="flex items-center gap-2.5 py-2 text-[12.5px]"
        >
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: moodColor(item.mood) }}
          />
          <span className="flex-1 font-medium text-[var(--foreground)]">
            {moodLabel(item.mood)}
          </span>
          <span className="text-[var(--muted)]">
            {item.count} check-in{item.count === 1 ? "" : "s"}
          </span>
          <span className="w-10 text-right font-semibold text-[var(--foreground)]">
            {total ? Math.round((item.count / total) * 100) : 0}%
          </span>
        </li>
      ))}
    </ul>
  );
}
