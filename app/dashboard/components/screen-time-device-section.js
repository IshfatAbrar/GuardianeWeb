"use client";

// The parent's side of Screen Time on an iOS child's phone, inside the Screen
// Time page: a banner that hands out the one-time code that unlocks its
// Screen Time settings, and a card with how well the device is protected and
// when it last checked in. On the child's iPhone
// those settings are read-only until this code is typed in (kid app:
// Menu → Screen Time → Parent unlock) — see app/lib/screenTimeUnlock.js.

import { useEffect, useState } from "react";
import {
  daysSinceSeen,
  isDeviceStale,
  iosScreenTimeStatus,
} from "../../lib/childDevice";
import { requestScreenTimeUnlockCode } from "../../lib/screenTimeLimit";
import { SubpageCard } from "./subpage-shell";

function Row({ label, value, tone }) {
  const color =
    tone === "warn"
      ? "text-amber-600"
      : tone === "good"
        ? "text-emerald-600"
        : "text-[var(--foreground)]";
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-[13px] first:pt-0 last:pb-0">
      <span className="flex-shrink-0 text-[var(--muted)]">{label}</span>
      <span className={`text-right font-medium ${color}`}>{value}</span>
    </div>
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

function seenLabel(status) {
  const days = daysSinceSeen(status);
  if (days === null) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function useCountdown(expiresAt) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return null;
  return Math.max(0, Math.round((expiresAt.getTime() - now) / 1000));
}

function firstNameOf(child) {
  return child?.name?.split(" ")[0] || "your child";
}

// Prominent strip at the top of the page. Key it by child id so switching
// child drops a code that was issued for the other one.
export function ScreenTimeUnlockBanner({ child }) {
  const first = firstNameOf(child);
  const [unlock, setUnlock] = useState(null); // { code, expiresAt }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const secondsLeft = useCountdown(unlock?.expiresAt);
  const expired = unlock && secondsLeft === 0;
  const showCode = unlock && !expired;

  async function getCode() {
    setBusy(true);
    setError(null);
    try {
      setUnlock(await requestScreenTimeUnlockCode(child.id));
    } catch (e) {
      setError(e?.message || "Couldn't create a code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)]">
          <svg {...ICON_PROPS} aria-hidden>
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-[var(--foreground)]">
            Change settings on {first}&apos;s iPhone
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
            {showCode ? (
              <>
                On {first}&apos;s phone, go to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  Menu → Screen Time → Parent unlock
                </span>{" "}
                and enter this code.
              </>
            ) : (
              <>
                {first} can&apos;t change Screen Time alone. Get a one-time code
                to unlock it on their phone.
              </>
            )}
          </p>
          {error && (
            <p className="mt-1 text-[12px] text-[var(--danger)]">{error}</p>
          )}
        </div>
      </div>

      {showCode ? (
        <div className="flex-shrink-0 rounded-xl border border-[var(--accent-border)] bg-[var(--surface)] px-5 py-2.5 text-center">
          <p
            className="font-mono text-[26px] font-bold leading-tight tracking-[0.3em] text-[var(--accent)]"
            aria-label={`Unlock code ${unlock.code.split("").join(" ")}`}
          >
            {unlock.code}
          </p>
          <p className="text-[11.5px] text-[var(--muted)]">
            Expires in {Math.floor(secondsLeft / 60)}:
            {String(secondsLeft % 60).padStart(2, "0")}
          </p>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy || !child}
          onClick={getCode}
          className="flex-shrink-0 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {busy ? "Creating…" : expired ? "Get a new code" : "Get unlock code"}
        </button>
      )}
    </section>
  );
}

export function ScreenTimeDeviceCard({ child, childDoc, className = "" }) {
  const first = firstNameOf(child);
  const status = iosScreenTimeStatus(childDoc);
  const stale = isDeviceStale(status);

  return (
    <SubpageCard
      className={className}
      title={`${first[0].toUpperCase()}${first.slice(1)}'s iPhone`}
      icon={
        <svg {...ICON_PROPS}>
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      }
    >
      {!status ? (
        <p className="text-[13px] leading-relaxed text-[var(--muted)]">
          Not connected yet. Open Guardiané Kids on {first}&apos;s phone.
        </p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          <Row
            label="Limit"
            value={
              status.authorized && status.isMonitoring
                ? `On · ${status.selectedItemCount} ${status.selectedItemCount === 1 ? "app" : "apps"}`
                : !status.authorized
                  ? "Off · no permission"
                  : "Off · no apps picked"
            }
            tone={status.authorized && status.isMonitoring ? "good" : "warn"}
          />
          <Row
            label="Protection"
            value={
              status.authorizationMode === "child"
                ? "Family Sharing"
                : status.authorizationMode === "individual"
                  ? "Basic"
                  : "Not set up"
            }
            tone={status.authorizationMode === "child" ? "good" : "warn"}
          />
          <Row
            label="Last checked in"
            value={
              stale
                ? `${seenLabel(status)} · app may be removed`
                : seenLabel(status)
            }
            tone={stale ? "warn" : undefined}
          />
        </div>
      )}

      {status?.authorizationMode !== "child" && (
        <p className="mt-4 border-t border-[var(--border)] pt-4 text-[12px] leading-relaxed text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">Tip:</span>{" "}
          choose &quot;Use Family Sharing&quot; when setting up Screen Time so{" "}
          {first} can&apos;t turn it off.
        </p>
      )}
    </SubpageCard>
  );
}
