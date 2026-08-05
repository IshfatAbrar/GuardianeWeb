"use client";

// Last-7-days timeline — port of GuardParent report.js's `moodHistory.slice(-7)`
// row: weekday + date above a colored circle (score%), status label below, with
// a dashed empty circle + "No mood logged" on days that have no entry. Always
// the most recent 7 calendar days, independent of the selected range.

import { moodBand, moodLabel, scoreColor } from "../../../lib/mood";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MoodWeekTimeline({ days }) {
  if (!days?.length) return null;

  return (
    <div className="flex justify-between gap-1.5">
      {days.map((item) => (
        <div key={item.date.getTime()} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[var(--muted)]">
              {WEEKDAY[item.date.getDay()]}
            </span>
            <span className="text-[12px] font-semibold text-[var(--foreground)]">
              {item.date.getDate()}
            </span>
          </div>

          {item.score !== null ? (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: scoreColor(item.score) }}
            >
              <span className="text-[9px] font-bold text-white">
                {Math.round(item.score)}%
              </span>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]">
              <span className="text-[14px] font-bold text-[var(--muted)]">-</span>
            </div>
          )}

          <span className="text-center text-[9px] leading-tight text-[var(--muted)]">
            {item.score !== null ? moodLabel(moodBand(item.score)) : "No mood logged"}
          </span>
        </div>
      ))}
    </div>
  );
}
