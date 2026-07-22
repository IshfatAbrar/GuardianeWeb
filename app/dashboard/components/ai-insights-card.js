"use client";

// Gemini-written insights for the selected child, mirroring GuardParent's
// "AI Powered Insights" section (app/index.js) card for card and in the same
// order. The Android app generates and caches them; this only reads — see
// app/lib/aiInsights.js.
//
// Unlike GuardParent, there is no hardcoded fallback copy: it ships four static
// paragraphs when Gemini fails, which look identical to real insights and are
// about no child in particular. An empty state that explains itself is better.

import { hasInsightContent } from "../../lib/aiInsights";

const CARDS = [
  {
    key: "suggestedConversation",
    label: "Suggested conversation",
    accent: "var(--accent)",
    icon: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
      </>
    ),
  },
  {
    key: "conversationStarter",
    label: "Try asking",
    accent: "#8B5CF6",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  {
    key: "mood_insight",
    label: "Mood insight",
    accent: "#2ECC71",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </>
    ),
  },
  {
    key: "tip",
    label: "Tip for today",
    accent: "#F39C12",
    icon: (
      <>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.1 14a5 5 0 1 0-6.2 0c.6.5 1 1.2 1.1 2h4c.1-.8.5-1.5 1.1-2Z" />
      </>
    ),
  },
];

function Badge({ ageInDays }) {
  const label = ageInDays === 0 ? "Today" : "From yesterday";
  return (
    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
      {label}
    </span>
  );
}

export function AiInsightsCard({ insights, loading, childName }) {
  const childFirst = childName?.split(" ")[0];

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          AI insights
        </h2>
        {!loading && hasInsightContent(insights) && (
          <Badge ageInDays={insights.ageInDays} />
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]"
            />
          ))}
        </div>
      ) : !hasInsightContent(insights) ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="text-[13px] text-[var(--muted)]">
            {childFirst
              ? `No insight for ${childFirst} yet today.`
              : "No insight yet today."}{" "}
            Insights are written by the Guardiané parent app on Android and
            appear here once it has synced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {CARDS.filter(
            (c) => typeof insights[c.key] === "string" && insights[c.key].trim(),
          ).map((card) => (
            <article
              key={card.key}
              className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex items-center gap-2">
                <svg
                  width="15"
                  height="15"
                  fill="none"
                  stroke={card.accent}
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  {card.icon}
                </svg>
                <h3 className="text-[12px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                  {card.label}
                </h3>
              </div>
              <p className="text-[13.5px] leading-relaxed text-[var(--foreground)]">
                {insights[card.key]}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
