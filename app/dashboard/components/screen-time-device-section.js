"use client";

// The parent's side of Screen Time on an iOS child's phone, inside the Screen
// Time modal: how well the device is protected, when it last checked in, and a
// one-time code that unlocks its Screen Time settings. On the child's iPhone
// those settings are read-only until this code is typed in (kid app:
// Menu → Screen Time → Parent unlock) — see app/lib/screenTimeUnlock.js.

import { useEffect, useState } from "react";
import {
  daysSinceSeen,
  isDeviceStale,
  iosScreenTimeStatus,
} from "../../lib/childDevice";
import { requestScreenTimeUnlockCode } from "../../lib/screenTimeLimit";

function Row({ label, value, tone }) {
  const color =
    tone === "warn"
      ? "text-amber-600"
      : tone === "good"
        ? "text-emerald-600"
        : "text-[var(--foreground)]";
  return (
    <div className="flex items-start justify-between gap-3 text-[12.5px]">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={`text-right font-medium ${color}`}>{value}</span>
    </div>
  );
}

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

export function ScreenTimeDeviceSection({ child, childDoc }) {
  const first = child?.name?.split(" ")[0] || "your child";
  const status = iosScreenTimeStatus(childDoc);
  const stale = isDeviceStale(status);
  const [unlock, setUnlock] = useState(null); // { code, expiresAt }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const secondsLeft = useCountdown(unlock?.expiresAt);
  const expired = unlock && secondsLeft === 0;

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
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
        <h2 className="text-[12.5px] font-semibold text-[var(--foreground)]">
          {first}&apos;s iPhone
        </h2>
        {!status ? (
          <p className="text-[12px] text-[var(--muted)]">
            Hasn&apos;t reported yet. Open Guardiané Kids on {first}&apos;s
            phone to connect it.
          </p>
        ) : (
          <>
            <Row
              label="Limit"
              value={
                status.authorized && status.isMonitoring
                  ? `On for ${status.selectedItemCount} ${status.selectedItemCount === 1 ? "app or category" : "apps and categories"}`
                  : !status.authorized
                    ? "Off — permission not granted"
                    : "Off — no apps picked"
              }
              tone={status.authorized && status.isMonitoring ? "good" : "warn"}
            />
            <Row
              label="Protection"
              value={
                status.authorizationMode === "child"
                  ? "Family Sharing — can't be removed without you"
                  : status.authorizationMode === "individual"
                    ? "Basic — can be turned off in iPhone Settings"
                    : "Not set up"
              }
              tone={status.authorizationMode === "child" ? "good" : "warn"}
            />
            <Row
              label="Last checked in"
              value={
                stale
                  ? `${seenLabel(status)} — the app may have been removed`
                  : seenLabel(status)
              }
              tone={stale ? "warn" : undefined}
            />
          </>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
        <h2 className="text-[12.5px] font-semibold text-[var(--foreground)]">
          Change settings on {first}&apos;s iPhone
        </h2>
        <p className="text-[11.5px] leading-relaxed text-[var(--muted)]">
          {first} can see their Screen Time settings but can&apos;t change them.
          To set it up or pick which apps are limited, get a code here, then on{" "}
          {first}&apos;s phone open Menu → Screen Time → Parent unlock and type
          it in. A code works once, for 10 minutes.
        </p>
        {unlock && !expired ? (
          <div className="rounded-lg bg-[var(--accent-bg)] py-3 text-center">
            <p
              className="font-mono text-[28px] font-bold tracking-[0.3em] text-[var(--accent)]"
              aria-label={`Unlock code ${unlock.code.split("").join(" ")}`}
            >
              {unlock.code}
            </p>
            <p className="text-[11px] text-[var(--muted)]">
              Expires in {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </p>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy || !child}
            onClick={getCode}
            className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-[12.5px] font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "Creating…"
              : expired
                ? "Get a new code"
                : "Get unlock code"}
          </button>
        )}
        {error && <p className="text-[11.5px] text-rose-500">{error}</p>}
      </div>

      {status?.authorizationMode !== "child" && (
        <p className="rounded-xl bg-[var(--surface-muted)] p-3 text-[11.5px] leading-relaxed text-[var(--muted)]">
          <span className="font-semibold text-[var(--foreground)]">
            Recommended: Apple Family Sharing.
          </span>{" "}
          If {first}&apos;s Apple ID is in your Family Sharing group, choose
          &quot;Use Family Sharing&quot; when setting up Screen Time on their
          phone. Then {first} can&apos;t turn it off or delete Guardiané without
          your approval. Without it, we&apos;ll alert you if Screen Time is
          turned off.
        </p>
      )}
    </div>
  );
}
