"use client";

// Legend mapping mood colors to day counts — "Great: 3 days" etc., matching
// GuardParent report.js's moodLegend (a wrapped, centered row of dot + text).

import { moodColor, moodLabel } from "../../../lib/mood";

export function MoodColorLegend({ distribution }) {
  if (!distribution.length) return null;
  return (
    <div className="flex flex-wrap justify-around gap-x-4 gap-y-2">
      {distribution.map((item) => (
        <div key={item.mood} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: moodColor(item.mood) }}
          />
          <span className="text-[12.5px] text-[var(--foreground)]">
            {moodLabel(item.mood)}: {item.count} day{item.count === 1 ? "" : "s"}
          </span>
        </div>
      ))}
    </div>
  );
}
