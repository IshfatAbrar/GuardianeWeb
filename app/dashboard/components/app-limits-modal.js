"use client";

// Parent-set app time limits, opened from the dashboard home page's Quick
// Actions. Writes to the child's own users/{childId} doc under
// `parentAppLimits` (see ../../lib/appLimits.js) — the child's Guardiane app
// picks this up on its normal sync cadence and enforces the stricter of the
// parent's cap and whatever the child set for themselves.
//
// The app picker is built from the child's most recent screen-time sync
// (`allApps`), not a live device query — the web has no way to see what's
// currently installed on the child's phone, only what it last reported using.
// A manual entry (app name + package name) covers anything not in that list.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { listenToDoc, getLatestScreenTimeForChild } from "../../lib/database";
import { setParentAppLimit, removeParentAppLimit } from "../../lib/appLimits";

const PRESET_MINUTES = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
];

function formatMinutes(total) {
  if (!total) return "No limit";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function AppLimitsModal({ open, onClose, childList, initialChildId }) {
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
      : childList[0]?.id ?? null,
  );
  const [childDoc, setChildDoc] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  // Which child's apps `recentApps` holds, so loading can be derived instead
  // of set synchronously at the top of the fetch effect (matches the
  // loadedKey pattern in mood-analytics-modal.js).
  const [appsLoadedFor, setAppsLoadedFor] = useState(null);
  const appsLoading = childId != null && appsLoadedFor !== childId;
  const [pendingApp, setPendingApp] = useState(null); // {packageName, appName} being limited
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPackage, setManualPackage] = useState("");

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
    // Only ever null when childList is empty, which its own render branch
    // below handles without reading childDoc — nothing to reset here.
    if (!childId) return undefined;
    return listenToDoc(`users/${childId}`, setChildDoc);
  }, [childId]);

  useEffect(() => {
    if (!childId) return undefined;
    let cancelled = false;
    getLatestScreenTimeForChild(childId)
      .then((entry) => {
        if (cancelled) return;
        const rows = Array.isArray(entry?.allApps) ? entry.allApps : [];
        const byPkg = new Map();
        for (const a of rows) {
          const pkg = a?.packageName || a?.appName;
          if (!pkg || byPkg.has(pkg)) continue;
          byPkg.set(pkg, { packageName: pkg, appName: a.appName || pkg });
        }
        setRecentApps(Array.from(byPkg.values()));
      })
      .catch(() => {
        if (!cancelled) setRecentApps([]);
      })
      .finally(() => {
        if (!cancelled) setAppsLoadedFor(childId);
      });
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const limitEntries = useMemo(() => {
    const limits = childDoc?.parentAppLimits || {};
    return Object.entries(limits)
      .map(([packageName, entry]) => ({
        packageName,
        minutes: typeof entry === "number" ? entry : entry?.minutes,
        appName: (typeof entry === "object" && entry?.appName) || packageName,
      }))
      .filter((e) => typeof e.minutes === "number" && e.minutes > 0)
      .sort((a, b) => a.appName.localeCompare(b.appName));
  }, [childDoc]);

  const limitedPackages = useMemo(
    () => new Set(limitEntries.map((e) => e.packageName)),
    [limitEntries],
  );
  const pickableApps = recentApps.filter((a) => !limitedPackages.has(a.packageName));

  const child = childList.find((c) => c.id === childId) ?? null;

  async function applyMinutes(app, minutes) {
    if (!childId || !app?.packageName || !minutes) return;
    setSaving(true);
    try {
      await setParentAppLimit(childId, app.packageName, minutes, app.appName);
      setPendingApp(null);
      setCustomValue("");
      setManualOpen(false);
      setManualName("");
      setManualPackage("");
    } catch {
      // Fire-and-forget UI: the write failing leaves the list unchanged,
      // which is a clear enough signal without a separate error banner.
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(packageName) {
    if (!childId) return;
    await removeParentAppLimit(childId, packageName);
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
        aria-labelledby="app-limits-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-4 pt-4 pb-2.5">
          <span className="w-10" />
          <h1
            id="app-limits-title"
            className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]"
          >
            App Time Limits
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
              Add a child first to set app limits.
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
                <svg width="14" height="14" className="mt-0.5 flex-shrink-0" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  Limits apply next time {child?.name?.split(" ")[0] || "your child"}&apos;s
                  app syncs (usually a few minutes) and require the latest
                  Guardiané child app.
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-[12.5px] font-semibold text-[var(--foreground)]">
                  Active limits
                </h2>
                {limitEntries.length === 0 ? (
                  <p className="rounded-xl bg-[var(--surface-muted)] px-3 py-3 text-center text-[12px] text-[var(--muted)]">
                    No limits set for {child?.name?.split(" ")[0] || "this child"} yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
                    {limitEntries.map((e) => (
                      <li
                        key={e.packageName}
                        className="flex items-center justify-between gap-2 bg-[var(--surface)] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-semibold text-[var(--foreground)]">
                            {e.appName}
                          </p>
                          <p className="text-[11px] text-[var(--muted)]">
                            {formatMinutes(e.minutes)} / day
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(e.packageName)}
                          className="flex-shrink-0 text-[11.5px] font-semibold text-rose-500 transition-colors hover:text-rose-600"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-[12.5px] font-semibold text-[var(--foreground)]">
                  Set a new limit
                </h2>

                {appsLoading ? (
                  <p className="text-[12px] text-[var(--muted)]">Loading recent apps…</p>
                ) : pickableApps.length === 0 ? (
                  <p className="text-[12px] text-[var(--muted)]">
                    No recently-synced apps to pick from.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
                    {pickableApps.map((a) => (
                      <li key={a.packageName}>
                        <button
                          type="button"
                          onClick={() => setPendingApp(a)}
                          className="flex w-full items-center justify-between gap-2 bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)]"
                        >
                          <span className="truncate text-[12.5px] font-medium text-[var(--foreground)]">
                            {a.appName}
                          </span>
                          <span className="flex-shrink-0 text-[11px] text-[var(--accent)]">
                            Set limit
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!manualOpen ? (
                  <button
                    type="button"
                    onClick={() => setManualOpen(true)}
                    className="text-[12px] font-semibold text-[var(--accent)] hover:opacity-80"
                  >
                    + Add an app manually
                  </button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="App name (e.g. Instagram)"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[12.5px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                    <input
                      type="text"
                      value={manualPackage}
                      onChange={(e) => setManualPackage(e.target.value)}
                      placeholder="Package name (e.g. com.instagram.android)"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-1.5 text-[12.5px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
                    />
                    <div className="flex justify-end gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setManualOpen(false)}
                        className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!manualName.trim() || !manualPackage.trim()}
                        onClick={() =>
                          setPendingApp({
                            packageName: manualPackage.trim(),
                            appName: manualName.trim(),
                          })
                        }
                        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {pendingApp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => !saving && setPendingApp(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-[var(--shadow-elevated)]"
          >
            <h3 className="text-[14px] font-semibold text-[var(--foreground)]">
              Limit for {pendingApp.appName}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MINUTES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  disabled={saving}
                  onClick={() => applyMinutes(pendingApp, p.value)}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
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
                onClick={() => applyMinutes(pendingApp, Number(customValue))}
                className="flex-shrink-0 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Set
              </button>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => setPendingApp(null)}
              className="w-full rounded-lg py-1.5 text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
