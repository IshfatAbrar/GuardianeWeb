"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function LiveChatModal({ open, onClose }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} />;
}

function Content({ onClose }) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-chat-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bg)] text-[var(--accent)]">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 id="live-chat-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Emergency Chat
          </h1>
          <div className="space-y-3">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            <p className="text-[13px] text-[var(--muted)]">
              Connecting you to a licensed counselor…
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
