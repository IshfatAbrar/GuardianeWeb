"use client";

import { useEffect, useState } from "react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LINE = "1.1em";
const DURATION_MS = 1600;
const STAGGER_MS = 120;

function Digit({ digit, delay }) {
  // Each digit owns its own "rest at 0, then roll" step. Tracking it per digit
  // (rather than once for the whole number) matters because the wellbeing tile
  // first renders "—" and only gets its real value once the data loads: its
  // digits mount *after* the page is ready, and mounting straight at the final
  // position means there is nothing to transition from — the 88 just appeared.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    // Two frames, so the browser has painted (and computed styles for) the
    // resting position before the transform changes; otherwise it skips the
    // transition.
    let inner;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(digit));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [digit]);

  return (
    <span
      aria-hidden
      className="inline-block overflow-hidden align-top"
      style={{ height: LINE, lineHeight: LINE }}
    >
      <span
        className="flex flex-col motion-reduce:!transition-none"
        style={{
          transform: `translateY(calc(${shown} * -${LINE}))`,
          transition: `transform ${DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        }}
      >
        {DIGITS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </span>
  );
}

/**
 * A number whose digits roll like an odometer: on first render each digit
 * scrolls up from 0 to its value, and when `value` later changes (say, a
 * different child is selected) the digits that differ roll to the new ones.
 * Anything that isn't a digit (the "—" placeholder, a "." or ",") renders as is.
 */
export function RollingNumber({ value, className = "" }) {
  const text = String(value);
  const chars = Array.from(text);
  return (
    <span className={`inline-flex tabular-nums ${className}`}>
      <span className="sr-only">{text}</span>
      {chars.map((c, i) => {
        // Keyed from the right so a 9 → 10 change keeps the ones digit's column.
        const key = chars.length - i;
        return /\d/.test(c) ? (
          <Digit key={key} digit={Number(c)} delay={i * STAGGER_MS} />
        ) : (
          <span
            key={key}
            aria-hidden
            style={{ height: LINE, lineHeight: LINE }}
          >
            {c}
          </span>
        );
      })}
    </span>
  );
}
