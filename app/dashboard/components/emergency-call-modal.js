"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function EmergencyCallModal({ open, onClose, onConfirm }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} onConfirm={onConfirm} />;
}

function Content({ onClose, onConfirm }) {
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

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="emergency-call-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15">
            <svg width="24" height="24" fill="#EF4444" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h1 id="emergency-call-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Contact Emergency Services?
          </h1>
          <p className="text-[13px] text-[var(--muted)]">
            This will call 911. Only proceed if this is a real emergency.
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[var(--border)] border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3.5 text-[14px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className="px-4 py-3.5 text-[14px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/10"
          >
            Call Now
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
