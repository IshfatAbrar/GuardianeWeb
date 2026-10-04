"use client";

// Full-page views that replace the Home tab's content (Full Report, Screen
// Time, App Limits), plus the pieces they share so all three read like the
// Home cards they were opened from: same card border/radius, same TitleIcon +
// bold title header.
//
// SubpageShell jumps the dashboard's scroll container to the top on open, and
// puts it back where the parent was on the way out, so Back lands on the card
// they clicked.

import { useEffect, useRef } from "react";
import { TitleIcon } from "../../../components/title-icon";

export function SubpageShell({ title, subtitle, onBack, actions, children }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const scroller = rootRef.current?.closest("main");
    if (!scroller) return undefined;
    const previousTop = scroller.scrollTop;
    scroller.scrollTo({ top: 0 });
    return () => scroller.scrollTo({ top: previousTop });
  }, []);

  return (
    <div ref={rootRef} className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Home"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>

      {children}
    </div>
  );
}

// A Home-style card: optional TitleIcon + title row, optional right-hand
// action, then content.
export function SubpageCard({ icon, title, action, className = "", children }) {
  return (
    <section
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <TitleIcon>{icon}</TitleIcon>}
            <h2 className="truncate text-[16px] font-bold text-[var(--foreground)]">
              {title}
            </h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Big-number tile, same type scale as the Home stats row (stats-grid.js).
export function StatTile({ label, value, sub, tone }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold leading-none tracking-tight ${
          tone === "muted" ? "text-[var(--muted)]" : "text-[var(--accent)]"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[10px] text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

// Segmented control — used for the report range and the child switcher.
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition-colors ${
              active
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Child switcher for the header; renders nothing with one child or none.
export function ChildSwitcher({ childList, childId, onChange }) {
  if (childList.length < 2) return null;
  return (
    <Segmented
      ariaLabel="Child"
      value={childId}
      onChange={onChange}
      options={childList.map((c) => ({
        value: c.id,
        label: c.name?.split(" ")[0] || "Child",
      }))}
    />
  );
}

export function InfoNote({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--foreground)]">
      <svg
        width="16"
        height="16"
        className="mt-0.5 flex-shrink-0"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] px-6 py-10 text-center">
      <p className="text-[13.5px] font-semibold text-[var(--foreground)]">
        {title}
      </p>
      {text && (
        <p className="max-w-sm text-[12.5px] leading-relaxed text-[var(--muted)]">
          {text}
        </p>
      )}
    </div>
  );
}
