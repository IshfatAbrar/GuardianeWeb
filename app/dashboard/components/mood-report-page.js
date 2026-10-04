"use client";

// Full report for one child, shown as its own page on the dashboard Home tab
// (the "Full Report" button and the Reports quick action).
//
// Same content as GuardParent's Report screen (app/report.js) — Week/Month/
// Year range, mood donut with the period average, highest/average/lowest,
// a gap-filled last-7-days timeline, the screen-time roll-up and the "Key
// Insights" text — laid out for a full page: a stats row, then cards. The
// scale is the child app's 0–100 wellbeing score throughout; mood bands are
// Android's 4 (Great/Good/Fair/Poor).

import { useEffect, useMemo, useState } from "react";
import {
  getMoodEntriesForChild,
  getScreenTimeForChild,
} from "../../lib/database";
import {
  averageScore,
  dailySeries,
  distribution,
  entryScore,
  moodBand,
  moodLabel,
} from "../../lib/mood";
import {
  aggregateApps,
  formatDuration,
  totalSeconds,
} from "../../lib/screenTime";
import { MoodDonutChart } from "./mood/mood-donut-chart";
import { MoodColorLegend } from "./mood/mood-color-legend";
import { MoodWeekTimeline } from "./mood/mood-week-timeline";
import { ScreenTimeReport } from "./screen-time-report";
import {
  EmptyState,
  Segmented,
  StatTile,
  SubpageCard,
  SubpageShell,
} from "./subpage-shell";

// Matches GuardParent's segmented control exactly: week/month/year, nothing else.
const RANGES = [
  { id: "week", label: "Week", days: 7, subtitle: "Last 7 days" },
  { id: "month", label: "Month", days: 30, subtitle: "Last 30 days" },
  { id: "year", label: "Year", days: 365, subtitle: "Last year" },
];

const ICON_PROPS = {
  width: 18,
  height: 18,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export function MoodReportPage({ child, onBack }) {
  const [rangeId, setRangeId] = useState("week");
  const [entries, setEntries] = useState([]);
  const [screenTime, setScreenTime] = useState([]);
  // Which (child, range) the loaded data belongs to. Deriving `loading` from it
  // means switching range shows the spinner rather than the previous range's
  // numbers, without setting state synchronously inside the effect.
  const [loadedKey, setLoadedKey] = useState(null);

  const activeRange = RANGES.find((r) => r.id === rangeId) ?? RANGES[0];
  const days = activeRange.days;
  const dataKey = `${child?.id ?? ""}:${days}`;
  const loading = loadedKey !== dataKey;

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
  const scores = useMemo(
    () => entries.map(entryScore).filter((s) => s !== null),
    [entries],
  );
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
  const screenSeconds = useMemo(() => totalSeconds(screenTime), [screenTime]);
  // Days that actually reported, not the length of the window — dividing by the
  // window would quietly understate a child who only syncs a few days a week.
  const syncedDays = useMemo(
    () =>
      new Set(
        screenTime
          .map((r) => r.dateString || r.createdAt?.toDate?.()?.toDateString())
          .filter(Boolean),
      ).size,
    [screenTime],
  );

  const childFirstName = child?.name?.split(" ")[0] || "Child";
  const hasMood = scores.length > 0;

  return (
    <SubpageShell
      title={`${childFirstName}'s Report`}
      subtitle={`Mood and screen time · ${activeRange.subtitle}`}
      onBack={onBack}
      actions={
        <Segmented
          ariaLabel="Report range"
          value={rangeId}
          onChange={setRangeId}
          options={RANGES.map((r) => ({ value: r.id, label: r.label }))}
        />
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--muted)]">
          Loading report…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Average mood"
              value={hasMood ? Math.round(average) : "—"}
              sub={
                hasMood
                  ? `${moodLabel(moodBand(average))} · ${scores.length} check-in${scores.length === 1 ? "" : "s"}`
                  : "No check-ins yet"
              }
              tone={hasMood ? undefined : "muted"}
            />
            <StatTile
              label="Highest"
              value={hasMood ? Math.round(Math.max(...scores)) : "—"}
              sub={hasMood ? moodLabel(moodBand(Math.max(...scores))) : "—"}
              tone={hasMood ? undefined : "muted"}
            />
            <StatTile
              label="Lowest"
              value={hasMood ? Math.round(Math.min(...scores)) : "—"}
              sub={hasMood ? moodLabel(moodBand(Math.min(...scores))) : "—"}
              tone={hasMood ? undefined : "muted"}
            />
            <StatTile
              label="Screen time"
              value={screenSeconds > 0 ? formatDuration(screenSeconds) : "—"}
              sub={
                syncedDays > 0
                  ? `${formatDuration(screenSeconds / syncedDays)}/day · ${syncedDays} of ${days} days synced`
                  : "No syncs in this period"
              }
              tone={screenSeconds > 0 ? undefined : "muted"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SubpageCard
              title="Mood breakdown"
              icon={
                <svg {...ICON_PROPS}>
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
              }
            >
              {dist.length > 0 ? (
                <div className="flex flex-col items-center gap-5">
                  <MoodDonutChart distribution={dist} average={average} />
                  <MoodColorLegend distribution={dist} />
                </div>
              ) : (
                <EmptyState
                  title="No mood data"
                  text={`${childFirstName} hasn't logged a mood in this period.`}
                />
              )}
            </SubpageCard>

            <SubpageCard
              title="Last 7 days"
              className="lg:col-span-2"
              icon={
                <svg {...ICON_PROPS}>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            >
              <MoodWeekTimeline days={timelineDays} />
            </SubpageCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <SubpageCard
              title="Screen time by app"
              className="lg:col-span-3"
              icon={
                <svg {...ICON_PROPS}>
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              }
            >
              <ScreenTimeReport apps={apps} />
            </SubpageCard>

            <SubpageCard
              title="Key insights"
              className="lg:col-span-2"
              icon={
                <svg {...ICON_PROPS}>
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
                </svg>
              }
            >
              <div className="space-y-3">
                <InsightRow
                  title="Mood trends"
                  text={moodTrendsText(scores.length, average)}
                />
                <InsightRow
                  title="Screen time patterns"
                  text={
                    apps.length > 0
                      ? `Most active app is ${apps[0].appName} with ${Math.round(apps[0].percentage)}% of total screen time.`
                      : "No screen-time data available for this period."
                  }
                />
              </div>
            </SubpageCard>
          </div>
        </>
      )}
    </SubpageShell>
  );
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

function InsightRow({ title, text }) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
        {text}
      </p>
    </div>
  );
}
