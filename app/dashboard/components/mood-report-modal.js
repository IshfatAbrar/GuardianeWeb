"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getMoodEntriesForChildInRange } from "../../lib/database";

const MOOD_SCORE = {
  happy: 5,
  positive: 4,
  neutral: 3,
  okay: 3,
  sad: 2,
  anxious: 2,
  angry: 1,
};

const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const s = startOfDay(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatMonthDay(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatLongDate(d) {
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function scoreFor(entry) {
  const key = String(entry?.mood || entry?.label || "").toLowerCase();
  return MOOD_SCORE[key] ?? 0;
}

function summarize(entries, weekStart) {
  const scored = entries.map((e) => scoreFor(e)).filter((n) => n > 0);
  const average = scored.length
    ? scored.reduce((a, b) => a + b, 0) / scored.length
    : 0;

  const byDay = new Map();
  for (const e of entries) {
    const ms = e.timestamp?.toMillis?.();
    if (typeof ms !== "number") continue;
    const day = new Date(ms);
    day.setHours(0, 0, 0, 0);
    const key = day.getTime();
    const score = scoreFor(e);
    if (!byDay.has(key)) byDay.set(key, { total: 0, count: 0 });
    if (score > 0) {
      const slot = byDay.get(key);
      slot.total += score;
      slot.count += 1;
    }
  }

  let bestDay = null;
  let bestAvg = -1;
  for (const [key, { total, count }] of byDay.entries()) {
    if (count === 0) continue;
    const avg = total / count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = new Date(key);
    }
  }

  const half = 3;
  let firstSum = 0;
  let firstCount = 0;
  let secondSum = 0;
  let secondCount = 0;
  for (const [key, { total, count }] of byDay.entries()) {
    if (count === 0) continue;
    const dayIndex = Math.floor((key - weekStart.getTime()) / 86_400_000);
    if (dayIndex < half) {
      firstSum += total;
      firstCount += count;
    } else {
      secondSum += total;
      secondCount += count;
    }
  }
  let trend = "Stable";
  if (firstCount && secondCount) {
    const f = firstSum / firstCount;
    const s = secondSum / secondCount;
    if (s - f > 0.5) trend = "Improving";
    else if (f - s > 0.5) trend = "Declining";
  }

  return {
    average,
    trend,
    bestDayLabel: bestDay ? WEEKDAY_LONG[bestDay.getDay()] : "—",
    daysWithData: Array.from(byDay.values()).filter((v) => v.count > 0).length,
  };
}

export function MoodReportModal({ open, onClose, child }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} child={child} />;
}

function Content({ onClose, child }) {
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [entries, setEntries] = useState([]);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!child?.id) return;
    let cancelled = false;
    getMoodEntriesForChildInRange(child.id, weekStart, weekEnd)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [child?.id, weekStart, weekEnd]);

  const summary = useMemo(
    () => summarize(entries, weekStart),
    [entries, weekStart],
  );

  const childFirstName = child?.name?.split(" ")[0] || "Child";
  const initial = childFirstName[0]?.toUpperCase() || "?";
  const weekRangeLabel = `${formatMonthDay(weekStart)} - ${formatMonthDay(addDays(weekEnd, -1))}`;
  const anchorLabel = `Week of ${formatLongDate(anchor)}`;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mood-report-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="w-12" />
          <h1
            id="mood-report-title"
            className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]"
          >
            Mood Report
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="w-12 text-right text-[15px] font-semibold text-[var(--accent)] hover:opacity-80"
          >
            Done
          </button>
        </div>

        <div className="space-y-5 px-5 pb-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-semibold text-white">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-[20px] font-bold leading-tight text-[var(--foreground)]">
                  {childFirstName}
                </h2>
                <p className="mt-0.5 text-[13px] text-[var(--muted)]">
                  Weekly Mood Report
                </p>
              </div>
              <div className="text-right">
                <p className="text-[24px] font-semibold leading-none text-[var(--muted)]">
                  {summary.average.toFixed(1)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--muted)]">Average</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <Stat
                icon={
                  <svg width="22" height="22" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="3 17 9 11 13 15 21 7" />
                    <polyline points="14 7 21 7 21 14" />
                  </svg>
                }
                value={summary.trend}
                label="Trend"
              />
              <Stat
                icon={
                  <svg width="22" height="22" fill="#3B82F6" viewBox="0 0 24 24">
                    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zM5 9h14v11H5V9z" />
                  </svg>
                }
                value={String(summary.daysWithData)}
                label="Days Tracked"
              />
              <Stat
                icon={
                  <svg width="22" height="22" fill="#F59E0B" viewBox="0 0 24 24">
                    <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2" />
                  </svg>
                }
                value={summary.bestDayLabel}
                label="Best Day"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => setAnchor((d) => addDays(d, -7))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--accent-bg)]"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[var(--foreground)]">
                {weekRangeLabel}
              </p>
              <p className="text-[11px] text-[var(--muted)]">{anchorLabel}</p>
            </div>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => setAnchor((d) => addDays(d, 7))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--accent)] hover:bg-[var(--accent-bg)]"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl bg-[var(--surface-muted)] p-8">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <svg width="46" height="46" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 9 12 13 8 21 16" />
                  <polyline points="17 16 21 16 21 12" />
                </svg>
                <h3 className="text-[16px] font-semibold text-[var(--foreground)]">
                  No Mood Data Available
                </h3>
                <p className="text-[13px] text-[var(--muted)]">
                  There&apos;s no mood data recorded for this week. Mood
                  tracking data comes from the child app.
                </p>
              </div>
            ) : (
              <WeekChart entries={entries} weekStart={weekStart} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-8 items-center justify-center">{icon}</div>
      <p className="text-[15px] font-semibold leading-tight text-[var(--foreground)]">
        {value}
      </p>
      <p className="text-[11px] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function WeekChart({ entries, weekStart }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayScores = days.map((d) => {
    const dayEntries = entries.filter((e) => {
      const ms = e.timestamp?.toMillis?.();
      if (typeof ms !== "number") return false;
      const ed = new Date(ms);
      return (
        ed.getFullYear() === d.getFullYear() &&
        ed.getMonth() === d.getMonth() &&
        ed.getDate() === d.getDate()
      );
    });
    const scores = dayEntries.map(scoreFor).filter((n) => n > 0);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  return (
    <div className="flex h-40 items-end gap-2">
      {dayScores.map((score, i) => {
        const heightPct = score > 0 ? (score / 5) * 100 : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-md bg-[var(--accent)]"
                style={{ height: `${heightPct}%`, opacity: heightPct ? 1 : 0.15 }}
              />
            </div>
            <span className="text-[10px] font-medium text-[var(--muted)]">
              {WEEKDAY_LONG[days[i].getDay()].slice(0, 1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
