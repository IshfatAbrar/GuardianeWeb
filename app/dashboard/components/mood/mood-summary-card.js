"use client";

// Summary card: average score, trend, and most frequent mood band.

import { moodEmoji, moodLabel } from "../../../lib/mood";

function SummaryItem({ title, value, subtitle }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 text-center">
      <span className="text-[11px] text-[var(--muted)]">{title}</span>
      <span className="text-[18px] font-bold leading-tight text-[var(--foreground)]">
        {value}
      </span>
      <span className="text-[10px] text-[var(--muted)]">{subtitle}</span>
    </div>
  );
}

export function MoodSummaryCard({ averageScore, trend, mostFrequentMood }) {
  return (
    <div className="flex items-stretch rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <SummaryItem
        title="Average"
        value={Math.round(averageScore)}
        subtitle="out of 100"
      />
      <div className="w-px self-stretch bg-[var(--border)]" />
      <SummaryItem title="Trend" value={trend} subtitle="this period" />
      <div className="w-px self-stretch bg-[var(--border)]" />
      <SummaryItem
        title="Most Common"
        value={mostFrequentMood ? moodEmoji(mostFrequentMood) : "—"}
        subtitle={mostFrequentMood ? moodLabel(mostFrequentMood) : ""}
      />
    </div>
  );
}
