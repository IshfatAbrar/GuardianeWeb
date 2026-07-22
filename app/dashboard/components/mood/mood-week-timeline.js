"use client";

// Daily-average timeline as a row of colored bars (score label on top, bar,
// weekday beneath).
//
// The bar height is a fraction of the FULL 0–100 wellbeing scale the child app
// writes — not a fraction of the tallest bar — so a good week and a bad week
// look different rather than both filling the frame. This used to divide by 6,
// left over from the retired 1–6 emotion model, which pinned every real score
// to full height.

import { scoreColor } from "../../../lib/mood";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_SCORE = 100;

export function MoodWeekTimeline({ dailyAverages }) {
  if (!dailyAverages.length) return null;

  return (
    <div className="flex h-40 items-end gap-2 overflow-x-auto">
      {dailyAverages.map((item) => {
        const heightPct = Math.max(6, (item.score / MAX_SCORE) * 100);
        return (
          <div
            key={item.date.getTime()}
            className="flex min-w-[28px] flex-1 flex-col items-center gap-1.5"
          >
            <span className="text-[9px] text-[var(--muted)]">
              {Math.round(item.score)}
            </span>
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className="w-6 rounded-md"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: scoreColor(item.score),
                }}
              />
            </div>
            <span className="text-[9px] text-[var(--muted)]">
              {WEEKDAY[item.date.getDay()]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
