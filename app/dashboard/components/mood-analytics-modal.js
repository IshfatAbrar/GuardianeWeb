"use client";

// Full report for one child, shown from the dashboard "Full Report" button.
//
// This is a deliberately exact port of GuardParent's Report screen
// (app/report.js): same Week/Month/Year range picker, mood donut with the
// period average in the center, the day-count legend, highest/average/lowest
// stat cards, a gap-filled last-7-days timeline, the screen-time roll-up, and
// the "Key Insights" text panel. The scale is the child app's 0–100 wellbeing
// score throughout; mood bands are Android's 4 (Great/Good/Fair/Poor), not the
// web's earlier 5-band model.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getMoodEntriesForChild, getScreenTimeForChild } from "../../lib/database";
import { averageScore, distribution, dailySeries } from "../../lib/mood";
import { aggregateApps } from "../../lib/screenTime";
import { MoodDonutChart } from "./mood/mood-donut-chart";
import { MoodColorLegend } from "./mood/mood-color-legend";
import { MoodWeekTimeline } from "./mood/mood-week-timeline";
import { MoodRangeStats } from "./mood/mood-range-stats";
import { ScreenTimeReport } from "./screen-time-report";

// Matches GuardParent's segmented control exactly: week/month/year, nothing else.
const RANGES = [
  { id: "week", label: "Week", days: 7, subtitle: "Last 7 days" },
  { id: "month", label: "Month", days: 30, subtitle: "Last 30 days" },
  { id: "year", label: "Year", days: 365, subtitle: "Last year" },
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

  const dist = useMemo(() => distribution(entries), [entries]);
  const totalMoodEntries = useMemo(
    () => dist.reduce((sum, d) => sum + d.count, 0),
    [dist],
  );
  // 0 with no entries, same as GuardParent's stat cards and donut center.
  const average = useMemo(() => averageScore(entries), [entries]);

  // Always the most recent 7 calendar days, gap-filled — independent of the
  // selected range, same as `moodHistory.slice(-7)` in GuardParent.
  const timelineDays = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return dailySeries(entries, start, end);
  }, [entries]);

  const apps = useMemo(() => aggregateApps(screenTime), [screenTime]);

  const childFirstName = child?.name?.split(" ")[0] || "Child";
  const activeRange = RANGES.find((r) => r.id === rangeId) ?? RANGES[0];

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      {/* Fixed max-height + its own scroll region, rather than relying on the
          centered overlay to grow/scroll — centering a flex item taller than
          its container is a classic overflow trap (content renders but can't
          be scrolled to). Capping height here sidesteps that entirely. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mood-analytics-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] max-w-[85vh] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-[var(--border)] px-4 pt-4 pb-2.5">
          <span className="w-10" />
          <div className="text-center">
            <h1
              id="mood-analytics-title"
              className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
            >
              {childFirstName}&apos;s Report
            </h1>
            <p className="text-[11.5px] text-[var(--muted)]">{activeRange.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 text-right text-[13px] font-semibold text-[var(--accent)] hover:opacity-80"
          >
            Done
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {/* Range picker (segmented control) */}
          <div className="flex rounded-xl bg-[var(--surface-muted)] p-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangeId(r.id)}
                className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
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
              <Section title="Mood Analysis">
                {dist.length > 0 ? (
                  <>
                    <div className="flex justify-center py-1">
                      <MoodDonutChart distribution={dist} average={average} />
                    </div>
                    <MoodColorLegend distribution={dist} />
                  </>
                ) : (
                  <NoMoodDataCard />
                )}

                <MoodRangeStats entries={entries} />

                <div className="space-y-2 rounded-xl bg-[var(--surface-muted)] p-2.5">
                  <h3 className="text-[12px] font-semibold text-[var(--foreground)]">
                    Mood Timeline
                  </h3>
                  <MoodWeekTimeline days={timelineDays} />
                </div>
              </Section>

              <Section title="Screen Time Report">
                <ScreenTimeReport entries={screenTime} days={days} />
              </Section>

              <Section title="Key Insights">
                <InsightCard
                  title="Mood Trends"
                  text={moodTrendsText(totalMoodEntries, average)}
                />
                <InsightCard
                  title="Screen Time Patterns"
                  text={
                    apps.length > 0
                      ? `Most active app is ${apps[0].appName} with ${Math.round(apps[0].percentage)}% of total screen time.`
                      : "No screen-time data available for this period."
                  }
                />
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Mirrors GuardParent's report.js hardcoded copy exactly — these are canned
// sentences, not real analysis, same caveat GuardParent's own UI doesn't state.
function moodTrendsText(totalEntries, average) {
  if (!totalEntries) {
    return "No mood data available for this period. Encourage your child to log their daily mood for personalized insights.";
  }
  if (average >= 80) {
    return "Your child has been consistently happy and positive this period!";
  }
  if (average >= 60) {
    return "Your child's mood has been generally good with some fluctuations.";
  }
  return "Consider having a conversation about your child's wellbeing based on recent mood patterns.";
}

function Section({ title, children }) {
  return (
    <div className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
      <h2 className="text-[13px] font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InsightCard({ title, text }) {
  return (
    <div className="space-y-1 rounded-xl bg-[var(--surface-muted)] p-2.5">
      <h3 className="text-[12px] font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-[12px] leading-relaxed text-[var(--muted)]">{text}</p>
    </div>
  );
}

function NoMoodDataCard() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-[var(--surface-muted)] p-5 text-center">
      <span className="text-[26px]" aria-hidden>
        📊
      </span>
      <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
        No Mood Data Available
      </h3>
      <p className="text-[12px] leading-relaxed text-[var(--muted)]">
        No mood entries found for the selected time period. Encourage your
        child to log their mood daily for better insights.
      </p>
    </div>
  );
}
