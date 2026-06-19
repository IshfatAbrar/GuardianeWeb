"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { jojoDisplayName, useJojoAuth } from "../lib/jojoAuth";

// Top-bar account control for a signed-in JoJo guest. The button shows their
// name (or email/phone); clicking it opens a small menu with their contact, a
// link to the full Guardiané app, and log out.
export function JojoUserMenu() {
  const { user, logOut } = useJojoAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const name = jojoDisplayName(user);
  const contact = user.email || user.phone || "";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-visible-ring flex max-w-[180px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[0.78rem] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] sm:px-3"
      >
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-semibold uppercase text-white">
          {(name[0] || "?").toUpperCase()}
        </span>
        <span className="truncate">{name}</span>
        <svg
          width="11"
          height="11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          className={`flex-shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl"
        >
          <div className="border-b border-[var(--border)] px-3.5 py-3">
            <p className="truncate text-[12.5px] font-semibold text-[var(--foreground)]">
              {name}
            </p>
            {contact && (
              <p className="truncate text-[11px] text-[var(--muted)]">
                {contact}
              </p>
            )}
          </div>

          <Link
            href="/signup"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            Access the full app
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logOut();
            }}
            className="flex w-full items-center gap-2.5 border-t border-[var(--border)] px-3.5 py-2.5 text-left text-[12.5px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              className="text-[var(--muted)]"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
