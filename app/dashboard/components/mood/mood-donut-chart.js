"use client";

// Donut chart showing the proportion of each mood band. Port of GuardParent's
// report.js mood chart: a ring of arc segments with the period's average score
// in the center (not an entry count — that's what Android shows there).

import { moodColor } from "../../../lib/mood";

const SIZE = 140;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

export function MoodDonutChart({ distribution, average }) {
  const total = distribution.reduce((sum, d) => sum + d.count, 0);

  let offset = 0;
  const segments = distribution.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const seg = {
      mood: item.mood,
      color: moodColor(item.mood),
      length: fraction * CIRCUMFERENCE,
      offset,
    };
    offset += seg.length;
    return seg;
  });

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        // Rotate -90° so the first segment starts at 12 o'clock (matches iOS).
        style={{ transform: "rotate(-90deg)" }}
      >
        {total === 0 ? (
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth={STROKE}
          />
        ) : (
          segments.map((seg) => (
            <circle
              key={seg.mood}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
              strokeDashoffset={-seg.offset}
            />
          ))
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold leading-none text-[var(--foreground)]">
          {Math.round(average)}%
        </span>
        <span className="mt-1 text-[10.5px] text-[var(--muted)]">Average</span>
      </div>
    </div>
  );
}
