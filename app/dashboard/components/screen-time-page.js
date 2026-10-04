"use client";

// Screen Time for one child, shown as its own page on the dashboard Home tab
// (the Screen Time quick action, or Manage on the Screen Time card): the
// parent-set daily limit, plus — for an iPhone — its status and the one-time
// code that unlocks its settings (screen-time-device-section.js).
//
// The daily limit: Writes to the child's own users/{childId} doc under
// `screenTimeLimitMinutes` (see ../../lib/screenTimeLimit.js) — read by the
// iOS child app's ScreenTimeManager. Which apps/categories the limit applies
// to is chosen on the child's own device (Apple platform restriction, not a
// choice made here) — this control only sets the number of minutes.
//
// Android-only equivalent (per-app minutes) lives in app-limits-page.js —
// this is a separate, iOS-only mechanism, hence a separate control.

import { useEffect, useState } from "react";
import { listenToDoc } from "../../lib/database";
import { setScreenTimeLimit } from "../../lib/screenTimeLimit";
import { childPlatform, CHILD_PLATFORM } from "../../lib/childDevice";
import {
  ScreenTimeDeviceCard,
  ScreenTimeUnlockBanner,
} from "./screen-time-device-section";
import {
  ChildSwitcher,
  EmptyState,
  SubpageCard,
  SubpageShell,
} from "./subpage-shell";

const PRESET_MINUTES = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
];

function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function ScreenTimePage({ childList = [], initialChildId, onBack }) {
  const [childId, setChildId] = useState(
    initialChildId && childList.some((c) => c.id === initialChildId)
      ? initialChildId
      : (childList[0]?.id ?? null),
  );
  const [childDoc, setChildDoc] = useState(null);
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!childId) return undefined;
    return listenToDoc(`users/${childId}`, setChildDoc);
  }, [childId]);

  const currentMinutes = childDoc?.screenTimeLimitMinutes || 0;
  const child = childList.find((c) => c.id === childId) ?? null;

  async function applyMinutes(minutes) {
    if (!childId || !minutes) return;
    setSaving(true);
    setError(null);
    try {
      await setScreenTimeLimit(childId, minutes);
      setCustomValue("");
    } catch (e) {
      setError(e?.message || "Couldn't save the limit.");
    } finally {
      setSaving(false);
    }
  }

  const first = child?.name?.split(" ")[0] || "your child";
  const showDevice =
    child && childPlatform(childDoc) !== CHILD_PLATFORM.ANDROID;

  return (
    <SubpageShell
      title="Screen Time"
      subtitle={
        child ? `Daily limit and device status for ${child.name}` : undefined
      }
      onBack={onBack}
      actions={
        <ChildSwitcher
          childList={childList}
          childId={childId}
          onChange={setChildId}
        />
      }
    >
      {childList.length === 0 ? (
        <EmptyState
          title="No children to manage"
          text="Add a child first to set a screen time limit."
        />
      ) : (
        <>
          {/* Android has no device-side setup to unlock. Unknown devices get
              it too, since the first setup itself needs a code. */}
          {showDevice && (
            <ScreenTimeUnlockBanner key={child.id} child={child} />
          )}

          <div
            className={`grid grid-cols-1 gap-4 ${showDevice ? "lg:grid-cols-5" : ""}`}
          >
            <SubpageCard
              title="Daily limit"
              className={showDevice ? "lg:col-span-3" : ""}
              icon={
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            >
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-semibold leading-none tracking-tight ${
                    currentMinutes
                      ? "text-[var(--accent)]"
                      : "text-[var(--muted)]"
                  }`}
                >
                  {currentMinutes ? formatMinutes(currentMinutes) : "No limit"}
                </span>
                {currentMinutes > 0 && (
                  <span className="text-[13px] text-[var(--muted)]">
                    per day
                  </span>
                )}
              </div>
              <p className="mt-2 text-[12.5px] text-[var(--muted)]">
                Covers the apps picked on {first}&apos;s phone.
              </p>

              <div className="mt-6 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                  Choose a limit
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {PRESET_MINUTES.map((p) => {
                    const active = currentMinutes === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        disabled={saving}
                        aria-pressed={active}
                        onClick={() => applyMinutes(p.value)}
                        className={`rounded-xl border px-3 py-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                            : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <form
                  className="flex items-center gap-2 pt-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyMinutes(Number(customValue));
                  }}
                >
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      placeholder="Custom"
                      aria-label="Custom limit in minutes"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3.5 pr-20 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-[var(--muted)]">
                      minutes
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !Number(customValue)}
                    className="flex-shrink-0 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Set limit"}
                  </button>
                </form>
                {error && (
                  <p className="text-[12px] text-[var(--danger)]">{error}</p>
                )}
              </div>
            </SubpageCard>

            {showDevice && (
              <ScreenTimeDeviceCard
                child={child}
                childDoc={childDoc}
                className="lg:col-span-2"
              />
            )}
          </div>
        </>
      )}
    </SubpageShell>
  );
}
