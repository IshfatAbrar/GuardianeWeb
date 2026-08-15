"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

const HELP_TOPICS = [
  {
    title: "Linking your child's device",
    body:
      "Open the child app on the device you want to link, tap 'Scan to Link', and point the camera at the QR code shown next to your child's name in the sidebar.",
  },
  {
    title: "Assigning learning modules",
    body:
      "From Module Assignments → Assign Module, pick a child and a module, set a priority and optional due date, then tap Assign.",
  },
  {
    title: "What JoJo can help with",
    body:
      "JoJo is the in-app chatbot for teen safety, mental health, and digital well-being questions. JoJo offers general guidance, not medical or legal advice.",
  },
];

export function SupportModal({ open, onClose, mode = "help" }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} mode={mode} />;
}

function Content({ onClose, mode }) {
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

  const isHelp = mode === "help";

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1 id="support-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              {isHelp ? "Help Center" : "Contact Support"}
            </h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isHelp ? (
            <div className="space-y-3">
              {HELP_TOPICS.map((t) => (
                <div
                  key={t.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <p className="text-[13.5px] font-semibold text-[var(--foreground)]">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-[var(--muted)]">
                Our team usually replies within one business day. Email is the
                fastest way to reach us.
              </p>
              <a
                href="mailto:support@guardiane.app?subject=Guardian%C3%A9%20Support"
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <div>
                  <p className="text-[13.5px] font-semibold text-[var(--foreground)]">
                    support@guardiane.app
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    Click to compose an email
                  </p>
                </div>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-[var(--accent)]">
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </a>
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
                For urgent safety concerns about a child, please contact local
                emergency services. The in-app Crisis Management tab can help
                you do this quickly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
