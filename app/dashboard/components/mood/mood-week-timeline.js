"use client";

// Last-7-days timeline — port of GuardParent report.js's `moodHistory.slice(-7)`
// row: weekday + date above a colored circle (score), status label below, with
// a dashed empty circle on days that have no entry. Always the most recent 7
// calendar days, independent of the selected range. Today is highlighted.

import { moodBand, moodLabel, scoreColor } from "../../../lib/mood";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MoodWeekTimeline({ days }) {
  if (!days?.length) return null;
  const todayKey = new Date().toDateString();

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((item) => {
        const isToday = item.date.toDateString() === todayKey;
        return (
          <div
            key={item.date.getTime()}
            className={`flex flex-col items-center gap-2.5 rounded-xl px-1 py-4 ${
              isToday
                ? "border border-[var(--accent-border)] bg-[var(--accent-bg)]"
                : "border border-transparent"
            }`}
          >
            <div className="flex flex-col items-center leading-tight">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
                {isToday ? "Today" : WEEKDAY[item.date.getDay()]}
              </span>
              <span className="text-[15px] font-semibold text-[var(--foreground)]">
                {item.date.getDate()}
              </span>
            </div>

            {item.score !== null ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: scoreColor(item.score) }}
              >
                <span className="text-[13px] font-bold text-white">
                  {Math.round(item.score)}
                </span>
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[var(--border)]">
                <span className="text-[14px] font-bold text-[var(--muted)]">
                  –
                </span>
              </div>
            )}

            <span className="text-center text-[11px] leading-tight text-[var(--muted)]">
              {item.score !== null ? moodLabel(moodBand(item.score)) : "No log"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
