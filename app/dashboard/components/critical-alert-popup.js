"use client";

// Full-screen interrupt for a critical (Suicidal Reference) risk alert — the
// one severity where "the parent will see it eventually in the bell" isn't
// good enough. Shows as soon as an unread critical alert the parent hasn't
// already been shown for arrives, with an audible cue, and lets the parent
// jump straight to the Emergency tab or dismiss it.
//
// Deliberately independent of the bell's read state (useNotifications'
// markAllRead / the Firestore `isRead` field): dismissing this popup only
// stops it from popping up again for that alert, it does NOT mark the alert
// read — the bell and Emergency tab still show it until the parent actually
// acknowledges it there. "Unannounced" here means "not yet shown as a
// popup," tracked in its own localStorage set, separate from `isRead`.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { usePreference } from "../../lib/preferences";
import { playCriticalAlertSound } from "../../lib/alertSound";

const SEEN_KEY_PREFIX = "guardiane.criticalAlerts.seen:";
// Bounded so a long-lived account doesn't grow this localStorage key forever.
const MAX_SEEN = 200;
const SOUND_REPEAT_MS = 5000;
const MAX_SOUND_REPEATS = 6; // ~30s of repeats, then stays silent-but-visible.

function readSeen(key) {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(key, set) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-MAX_SEEN)));
}

function relativeTime(ms) {
  if (!ms) return "";
  const diff = Math.max(0, Date.now() - ms);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ms).toLocaleDateString();
}

export function CriticalAlertPopup({ alerts, childList, onGoToEmergency }) {
  const { user } = useAuth();
  const parentId = user?.uid ?? null;
  const seenKey = parentId ? `${SEEN_KEY_PREFIX}${parentId}` : null;

  const [soundEnabled] = usePreference("pref.criticalAlertSound", true);
  const [seen, setSeen] = useState(() => readSeen(seenKey));

  // Reload the seen set whenever the signed-in account changes, so one
  // parent's dismissals never suppress another's alerts on a shared device.
  // Adjusted during render (React's documented pattern for this) rather than
  // in an effect, same approach useNotifications.js uses for the same reason.
  const [lastSeenKey, setLastSeenKey] = useState(seenKey);
  if (seenKey !== lastSeenKey) {
    setLastSeenKey(seenKey);
    setSeen(readSeen(seenKey));
  }

  const queue = useMemo(() => {
    return (alerts || [])
      .filter((a) => a.severity === "critical" && !seen.has(a.id))
      .sort((a, b) => a.timestampMs - b.timestampMs);
  }, [alerts, seen]);

  const current = queue[0] ?? null;
  const child = useMemo(
    () => (childList || []).find((c) => c.id === current?.childId) ?? null,
    [childList, current?.childId],
  );

  const dismiss = () => {
    if (!current) return;
    setSeen((prev) => {
      const next = new Set(prev).add(current.id);
      if (seenKey) writeSeen(seenKey, next);
      return next;
    });
  };

  // Sound: once immediately when a new alert becomes current, then repeats
  // on an interval until dismissed or the repeat cap is hit.
  const currentId = current?.id ?? null;
  const repeatsRef = useRef(0);
  useEffect(() => {
    if (!currentId) return undefined;
    repeatsRef.current = 0;
    if (soundEnabled) playCriticalAlertSound();
    const interval = setInterval(() => {
      repeatsRef.current += 1;
      if (repeatsRef.current >= MAX_SOUND_REPEATS) {
        clearInterval(interval);
        return;
      }
      if (soundEnabled) playCriticalAlertSound();
    }, SOUND_REPEAT_MS);
    return () => clearInterval(interval);
  }, [currentId, soundEnabled]);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="critical-alert-title"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-rose-500 bg-[var(--background)] shadow-[0_0_0_6px_rgba(239,68,68,0.15)]">
        <div className="flex flex-col items-center gap-3 bg-rose-500/10 px-5 pt-6 pb-5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/40">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <div>
            <h1 id="critical-alert-title" className="text-[17px] font-bold text-rose-600">
              Critical Alert
            </h1>
            <p className="mt-0.5 text-[12.5px] font-medium text-[var(--foreground)]">
              {[child?.name, relativeTime(current.timestampMs)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="rounded-xl bg-[var(--surface-muted)] p-3">
            <p className="text-[12.5px] font-semibold text-[var(--foreground)]">
              {current.type || "Risk alert"}
            </p>
            {current.message && (
              <p className="mt-1 line-clamp-3 text-[12px] text-[var(--muted)]">
                {current.message}
              </p>
            )}
          </div>

          {queue.length > 1 && (
            <p className="text-center text-[11.5px] text-[var(--muted)]">
              +{queue.length - 1} more critical alert{queue.length - 1 === 1 ? "" : "s"} waiting
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              Ignore
            </button>
            <button
              type="button"
              onClick={() => {
                dismiss();
                onGoToEmergency?.();
              }}
              className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-600"
            >
              Go to Emergency
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
