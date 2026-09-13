"use client";

// Parent-set daily Screen Time limit, opened from the dashboard home page's
// Quick Actions. Writes to the child's own users/{childId} doc under
// `screenTimeLimitMinutes` (see ../../lib/screenTimeLimit.js) — read by the
// iOS child app's ScreenTimeManager. Which apps/categories the limit applies
// to is chosen on the child's own device (Apple platform restriction, not a
// choice made here) — this control only sets the number of minutes.
//
// Android-only equivalent (per-app minutes) lives in app-limits-modal.js —
// this is a separate, iOS-only mechanism, hence a separate control.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { listenToDoc } from "../../lib/database";
import { setScreenTimeLimit } from "../../lib/screenTimeLimit";

const PRESET_MINUTES = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
];

function formatMinutes(total) {
  if (!total) return "No limit set";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m / day`;
  if (h > 0) return `${h}h / day`;
  return `${m}m / day`;
}

export function ScreenTimeLimitModal({
  open,
  onClose,
  childList,
  initialChildId,
}) {
  if (!open || typeof document === "undefined") return null;
  return (
    <Content
      onClose={onClose}
      childList={childList || []}
      initialChildId={initialChildId}
    />
  );
}

function Content({ onClose, childList, initialChildId }) {
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

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="screen-time-limit-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-4 pt-4 pb-2.5">
          <span className="w-10" />
          <h1
            id="screen-time-limit-title"
            className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
          >
            Screen Time Limit
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="w-10 text-right text-[13px] font-semibold text-[var(--accent)] hover:opacity-80"
          >
            Done
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {childList.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--muted)]">
              Add a child first to set a screen time limit.
            </p>
          ) : (
            <>
              {childList.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {childList.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChildId(c.id)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                        c.id === childId
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {c.name?.split(" ")[0] || "Child"}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 rounded-xl bg-[var(--accent-bg)] p-3 text-[11.5px] leading-relaxed text-[var(--foreground)]">
                <svg
                  width="14"
                  height="14"
                  className="mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  Applies once {child?.name?.split(" ")[0] || "your child"} has
                  Screen Time set up in their Guardiané app. Which apps are
                  limited is chosen on their own device — this only sets how
                  many minutes.
                </span>
              </div>

              <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3 text-center">
                <p className="text-[13px] font-semibold text-[var(--foreground)]">
                  {formatMinutes(currentMinutes)}
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-[12.5px] font-semibold text-[var(--foreground)]">
                  Set daily limit
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MINUTES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      disabled={saving}
                      onClick={() => applyMinutes(p.value)}
                      className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                        currentMinutes === p.value
                          ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Custom minutes"
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[12.5px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    disabled={saving || !Number(customValue)}
                    onClick={() => applyMinutes(Number(customValue))}
                    className="flex-shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Set
                  </button>
                </div>
                {error && (
                  <p className="text-[11.5px] text-rose-500">{error}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
