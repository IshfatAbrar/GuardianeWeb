"use client";

// Full report for one child, shown from the dashboard "Full Report" button.
//
// This is the web's counterpart to GuardParent's Report screen (app/report.js):
// a range picker, mood summary, donut + legend, highest/average/lowest, a
// breakdown, a daily timeline and the screen-time roll-up for the same range.
// The scale is the child app's 0–100 wellbeing score throughout.
//
// Not carried over from GuardParent: its "Key Insights" panel, which is two
// hardcoded paragraphs of generic advice dressed up as analysis of this child.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getMoodEntriesForChild, getScreenTimeForChild } from "../../lib/database";
import {
  averageScore,
  distribution,
  mostFrequentMood,
  dailyAverages,
  trend,
} from "../../lib/mood";
import { MoodSummaryCard } from "./mood/mood-summary-card";
import { MoodDonutChart } from "./mood/mood-donut-chart";
import { MoodColorLegend } from "./mood/mood-color-legend";
import { MoodDistributionBars } from "./mood/mood-distribution-bars";
import { MoodWeekTimeline } from "./mood/mood-week-timeline";
import { MoodRangeStats } from "./mood/mood-range-stats";
import { ScreenTimeReport } from "./screen-time-report";

// Week/Month/Year match GuardParent's segmented control; 3 Months is kept
// because a quarter is the range where a slow decline actually becomes visible.
const RANGES = [
  { id: "week", label: "Week", days: 7 },
  { id: "month", label: "Month", days: 30 },
  { id: "quarter", label: "3 Months", days: 90 },
  { id: "year", label: "Year", days: 365 },
];

export function MoodAnalyticsModal({ open, onClose, child }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} child={child} />;
}

function Content({ onClose, child }) {
  const [rangeId, setRangeId] = useState("week");
  const [entries, setEntries] = useState([]);
  const [screenTime, setScreenTime] = useState([]);
  // Which (child, range) the loaded data belongs to. Deriving `loading` from it
  // means switching range shows the spinner rather than the previous range's
  // numbers, without setting state synchronously inside the effect.
  const [loadedKey, setLoadedKey] = useState(null);

  const days = RANGES.find((r) => r.id === rangeId)?.days ?? 7;
  const dataKey = `${child?.id ?? ""}:${days}`;
  const loading = loadedKey !== dataKey;

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

    // Screen time is fetched alongside mood but must not gate the report: a
    // child who logs moods and never syncs usage still has a mood report.
    getScreenTimeForChild(child.id, days)
      .then((rows) => {
        if (!cancelled) setScreenTime(rows);
      })
      .catch(() => {
        if (!cancelled) setScreenTime([]);
      });

    getMoodEntriesForChild(child.id, days)
      .then((rows) => {
        if (!cancelled) setEntries(rows);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(dataKey);
      });
    return () => {
      cancelled = true;
    };
  }, [child?.id, days, dataKey]);

  const stats = useMemo(
    () => ({
      average: averageScore(entries),
      dist: distribution(entries),
      frequent: mostFrequentMood(entries),
      daily: dailyAverages(entries),
      trend: trend(entries),
    }),
    [entries],
  );

  const childFirstName = child?.name?.split(" ")[0] || "Child";

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mood-analytics-title"
        onClick={(e) => e.stopPropagation()}
        className="relative my-4 w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="w-12" />
          <h1
            id="mood-analytics-title"
            className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]"
          >
            {childFirstName}&apos;s Report
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
          {/* Range picker (segmented control) */}
          <div className="flex rounded-xl bg-[var(--surface-muted)] p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangeId(r.id)}
                className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-colors ${
                  rangeId === r.id
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center text-[13px] text-[var(--muted)]">
              Loading…
            </div>
          ) : (
            <>
              {entries.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <MoodSummaryCard
                    averageScore={stats.average}
                    trend={stats.trend}
                    mostFrequentMood={stats.frequent}
                  />

                  <MoodRangeStats entries={entries} />

                  <Section title="Mood Distribution">
                    <div className="flex justify-center py-2">
                      <MoodDonutChart distribution={stats.dist} />
                    </div>
                    <MoodColorLegend distribution={stats.dist} />
                  </Section>

                  <Section title="Breakdown">
                    <MoodDistributionBars distribution={stats.dist} />
                  </Section>

                  <Section title="Daily Timeline">
                    <MoodWeekTimeline dailyAverages={stats.daily} />
                  </Section>
                </>
              )}

              <Section title="Screen Time">
                <ScreenTimeReport entries={screenTime} days={days} />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-[14px] font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--surface-muted)] p-10 text-center">
      <svg
        width="46"
        height="46"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <line x1="3" y1="20" x2="21" y2="20" />
        <rect x="5" y="11" width="3" height="7" />
        <rect x="11" y="7" width="3" height="11" />
        <rect x="17" y="13" width="3" height="5" />
      </svg>
      <h3 className="text-[16px] font-semibold text-[var(--foreground)]">
        No mood data yet
      </h3>
      <p className="text-[13px] text-[var(--muted)]">
        Mood entries from your child&apos;s app will appear here.
      </p>
    </div>
  );
}
