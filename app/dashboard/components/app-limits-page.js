"use client";

// Parent-set app time limits, shown as its own page on the dashboard Home tab
// (the App Limits quick action). Writes to the child's own users/{childId} doc under
// `parentAppLimits` (see ../../lib/appLimits.js) — the child's Guardiane app
// picks this up on its normal sync cadence and enforces the stricter of the
// parent's cap and whatever the child set for themselves.
//
// The app picker is built from the child's most recent screen-time sync
// (`allApps`), not a live device query — the web has no way to see what's
// currently installed on the child's phone, only what it last reported using.
// A manual entry (app name + package name) covers anything not in that list.

import { useEffect, useMemo, useState } from "react";
import { listenToDoc, getLatestScreenTimeForChild } from "../../lib/database";
import { setParentAppLimit, removeParentAppLimit } from "../../lib/appLimits";
import {
  ChildSwitcher,
  EmptyState,
  InfoNote,
  SubpageCard,
  SubpageShell,
} from "./subpage-shell";

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

export function AppLimitsPage({ childList = [], initialChildId, onBack }) {
  const [childId, setChildId] = useState(
    initialChildId && childList.some((c) => c.id === initialChildId)
      ? initialChildId
      : (childList[0]?.id ?? null),
  );
  const [childDoc, setChildDoc] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  // Which child's apps `recentApps` holds, so loading can be derived instead
  // of set synchronously at the top of the fetch effect (matches the
  // loadedKey pattern in mood-report-page.js).
  const [appsLoadedFor, setAppsLoadedFor] = useState(null);
  const appsLoading = childId != null && appsLoadedFor !== childId;
  const [pendingApp, setPendingApp] = useState(null); // {packageName, appName} being limited
  const [customValue, setCustomValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPackage, setManualPackage] = useState("");

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
  const pickableApps = recentApps.filter(
    (a) => !limitedPackages.has(a.packageName),
  );

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

  const first = child?.name?.split(" ")[0] || "your child";
  const inputCls =
    "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--accent)]";

  return (
    <SubpageShell
      title="App Time Limits"
      subtitle={child ? `Per-app daily limits for ${child.name}` : undefined}
      onBack={onBack}
      actions={
        <ChildSwitcher
          childList={childList}
          childId={childId}
          onChange={(id) => {
            setChildId(id);
            setPendingApp(null);
          }}
        />
      }
    >
      {childList.length === 0 ? (
        <EmptyState
          title="No children to manage"
          text="Add a child first to set app limits."
        />
      ) : (
        <>
          <InfoNote>
            Limits apply next time {first}&apos;s app syncs (usually a few
            minutes) and require the latest Guardiané child app.
          </InfoNote>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <SubpageCard
              title="Active limits"
              icon={
                <svg {...ICON_PROPS}>
                  <path d="M5 22h14" />
                  <path d="M5 2h14" />
                  <path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22" />
                  <path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2" />
                </svg>
              }
              action={
                limitEntries.length > 0 && (
                  <span className="rounded-full bg-[var(--accent-bg)] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--accent)]">
                    {limitEntries.length}
                  </span>
                )
              }
            >
              {limitEntries.length === 0 ? (
                <EmptyState
                  title="No limits yet"
                  text={`Pick an app on the right to cap how long ${first} can use it each day.`}
                />
              ) : (
                <ul className="divide-y divide-[var(--border)]">
                  {limitEntries.map((e) => (
                    <li
                      key={e.packageName}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <AppBadge name={e.appName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">
                          {e.appName}
                        </p>
                        <p className="text-[12px] text-[var(--muted)]">
                          {formatMinutes(e.minutes)} a day
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(e.packageName)}
                        className="flex-shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger-bg)]"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SubpageCard>

            <SubpageCard
              title={
                pendingApp ? `Limit for ${pendingApp.appName}` : "Add a limit"
              }
              icon={
                <svg {...ICON_PROPS}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              {pendingApp ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {PRESET_MINUTES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        disabled={saving}
                        onClick={() => applyMinutes(pendingApp, p.value)}
                        className="rounded-xl border border-[var(--border)] px-2 py-3 text-[13px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)] disabled:opacity-50"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      applyMinutes(pendingApp, Number(customValue));
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
                        className={`${inputCls} pr-20`}
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
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingApp(null)}
                    className="text-[12.5px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    ← Pick a different app
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                    Recently used on {first}&apos;s phone
                  </p>
                  {appsLoading ? (
                    <p className="py-6 text-center text-[12.5px] text-[var(--muted)]">
                      Loading recent apps…
                    </p>
                  ) : pickableApps.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-[12.5px] text-[var(--muted)]">
                      No recently-synced apps to pick from. Add one manually
                      below.
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
                      {pickableApps.map((a) => (
                        <li key={a.packageName}>
                          <button
                            type="button"
                            onClick={() => setPendingApp(a)}
                            className="group flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--accent-bg)]"
                          >
                            <AppBadge name={a.appName} />
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[var(--foreground)]">
                              {a.appName}
                            </span>
                            <span className="flex-shrink-0 text-[12px] font-semibold text-[var(--accent)] opacity-70 group-hover:opacity-100">
                              Set limit →
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="border-t border-[var(--border)] pt-4">
                    {!manualOpen ? (
                      <button
                        type="button"
                        onClick={() => setManualOpen(true)}
                        className="text-[12.5px] font-semibold text-[var(--accent)] hover:opacity-80"
                      >
                        + Add an app manually
                      </button>
                    ) : (
                      <form
                        className="space-y-2.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!manualName.trim() || !manualPackage.trim())
                            return;
                          setPendingApp({
                            packageName: manualPackage.trim(),
                            appName: manualName.trim(),
                          });
                        }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                          Add manually
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="App name (e.g. Instagram)"
                            className={inputCls}
                          />
                          <input
                            type="text"
                            value={manualPackage}
                            onChange={(e) => setManualPackage(e.target.value)}
                            placeholder="Package (com.instagram.android)"
                            className={inputCls}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setManualOpen(false)}
                            className="rounded-xl px-4 py-2 text-[12.5px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              !manualName.trim() || !manualPackage.trim()
                            }
                            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Continue
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </SubpageCard>
          </div>
        </>
      )}
    </SubpageShell>
  );
}

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

// Letter tile standing in for an app icon — the web never sees the real ones.
function AppBadge({ name }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[13px] font-bold text-[var(--accent)]"
    >
      {(name || "?").trim()[0]?.toUpperCase() || "?"}
    </span>
  );
}
