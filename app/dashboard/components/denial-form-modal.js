"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  denyAccessRequest,
  DENIAL_QUICK_REASONS,
} from "../../lib/accessRequests";

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-[12.5px] text-[var(--muted)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

export function DenialFormModal({ open, onClose, onDenied, request, childName }) {
  if (!open || typeof document === "undefined" || !request) return null;
  return (
    <DenialContent
      request={request}
      childName={childName}
      onClose={onClose}
      onDenied={onDenied}
    />
  );
}

function DenialContent({ request, childName, onClose, onDenied }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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

  async function handleDeny() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await denyAccessRequest(request.id, { reason });
      onDenied?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to deny");
    } finally {
      setSubmitting(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deny-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Cancel
            </button>
            <h1
              id="deny-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              Deny Request
            </h1>
            <button
              type="button"
              onClick={handleDeny}
              disabled={submitting}
              className={`text-[14px] font-semibold transition-colors ${
                submitting
                  ? "cursor-not-allowed text-[var(--muted)]"
                  : "text-rose-500 hover:text-rose-600"
              }`}
            >
              {submitting ? "Saving…" : "Deny"}
            </button>
          </div>

          <div className="h-px w-full bg-[var(--border)]" />

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Request Details
            </p>
            <div className="divide-y divide-[var(--border)]">
              <Row label="App" value={request.requestedApp || "—"} />
              <Row label="Requested by" value={childName || "Unknown"} />
              <Row label="Requested at" value={formatDateTime(request.requestedAt)} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Reason for Denial
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a reason for denial (optional)…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Quick Reasons
            </p>
            <div className="flex flex-col gap-2">
              {DENIAL_QUICK_REASONS.map((qr) => {
                const active = reason === qr;
                return (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReason(qr)}
                    className={`rounded-xl border px-4 py-2.5 text-left text-[13px] font-medium transition-colors ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    {qr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
