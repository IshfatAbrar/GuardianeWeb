"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  approveAccessRequest,
  formatTimeLimit,
  TIME_LIMIT_OPTIONS,
} from "../../lib/accessRequests";

const QUICK_OPTIONS = [
  { id: 30 * 60, label: "30m" },
  { id: 60 * 60, label: "1h" },
  { id: 2 * 60 * 60, label: "2h" },
  { id: 4 * 60 * 60, label: "4h" },
];

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

export function ApprovalFormModal({ open, onClose, onApproved, request, childName }) {
  if (!open || typeof document === "undefined" || !request) return null;
  return (
    <ApprovalContent
      request={request}
      childName={childName}
      onClose={onClose}
      onApproved={onApproved}
    />
  );
}

function ApprovalContent({ request, childName, onClose, onApproved }) {
  const [timeLimit, setTimeLimit] = useState(60 * 60);
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

  const expiresAt = useMemo(
    () => new Date(Date.now() + timeLimit * 1000),
    [timeLimit],
  );

  async function handleApprove() {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await approveAccessRequest(request.id, {
        timeLimitSeconds: timeLimit,
        reason,
      });
      onApproved?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to approve");
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
        aria-labelledby="approve-title"
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
              id="approve-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              Approve Request
            </h1>
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className={`text-[14px] font-semibold transition-colors ${
                submitting
                  ? "cursor-not-allowed text-[var(--muted)]"
                  : "text-emerald-500 hover:text-emerald-600"
              }`}
            >
              {submitting ? "Saving…" : "Approve"}
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

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Access Duration
            </p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="relative">
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 pr-10 text-[14px] text-[var(--foreground)] focus:outline-none"
                >
                  {TIME_LIMIT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--accent)]"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className="mt-3 divide-y divide-[var(--border)]">
                <Row label="Duration" value={formatTimeLimit(timeLimit)} />
                <Row label="Expires at" value={formatDateTime(expiresAt)} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_OPTIONS.map((o) => {
                  const active = timeLimit === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setTimeLimit(o.id)}
                      className={`rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-colors ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Reason (Optional)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Add a reason for approval…"
              rows={3}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[13.5px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
