"use client";

import { useState } from "react";
import { ApprovalFormModal } from "./approval-form-modal";
import { DenialFormModal } from "./denial-form-modal";
import {
  deleteAccessRequest,
  effectiveRequestStatus,
  formatTimeLimit,
  isAccessRequestExpired,
  REQUEST_STATUS,
} from "../../lib/accessRequests";

const STATUS_META = {
  [REQUEST_STATUS.PENDING]: { label: "Pending", className: "bg-amber-500/15 text-amber-500" },
  [REQUEST_STATUS.APPROVED]: { label: "Approved", className: "bg-emerald-500/15 text-emerald-500" },
  [REQUEST_STATUS.DENIED]: { label: "Denied", className: "bg-rose-500/15 text-rose-500" },
  [REQUEST_STATUS.EXPIRED]: { label: "Expired", className: "bg-[var(--surface-muted)] text-[var(--muted)]" },
};

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

function DetailRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-[12.5px] text-[var(--muted)]">{label}</span>
      <span className={`text-[13px] font-semibold ${accent || "text-[var(--foreground)]"}`}>
        {value}
      </span>
    </div>
  );
}

function TimelineItem({ title, time, color, completed }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
          completed ? color : "bg-[var(--surface-muted)]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-semibold ${completed ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
          {title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
          {formatDateTime(time)}
        </p>
      </div>
      {completed && (
        <svg className={color.replace("bg-", "text-")} width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14.5-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5z" />
        </svg>
      )}
    </div>
  );
}

export function RequestDetailView({ request, childName, onBack, onChanged }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showDeny, setShowDeny] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!request) return null;

  const effStatus = effectiveRequestStatus(request);
  const statusMeta = STATUS_META[effStatus] || STATUS_META[REQUEST_STATUS.PENDING];
  const expired = isAccessRequestExpired(request);

  async function handleDelete() {
    setBusy(true);
    setErrorMessage(null);
    try {
      await deleteAccessRequest(request);
      onChanged?.();
      onBack?.();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete");
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 p-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Access request
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {request.requestedApp || "Request"}
          </h1>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        {/* App header */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold tracking-tight text-[var(--foreground)]">
                {request.requestedApp || "—"}
              </p>
              <p className="text-[12.5px] text-[var(--muted)]">
                Requested by {childName || "Unknown"}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          </div>
          {request.reason && (
            <p className="mt-4 rounded-xl bg-[var(--surface-muted)] p-3 text-[13px] text-[var(--foreground)]">
              {request.reason}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="mb-1 text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
            Request Details
          </p>
          <div className="divide-y divide-[var(--border)]">
            <DetailRow label="App" value={request.requestedApp || "—"} />
            <DetailRow label="Requested by" value={childName || "Unknown"} />
            <DetailRow label="Requested at" value={formatDateTime(request.requestedAt)} />
            {request.approvedAt && (
              <DetailRow
                label="Approved at"
                value={formatDateTime(request.approvedAt)}
                accent="text-emerald-500"
              />
            )}
            {request.deniedAt && (
              <DetailRow
                label="Denied at"
                value={formatDateTime(request.deniedAt)}
                accent="text-rose-500"
              />
            )}
            {request.timeLimit && (
              <DetailRow label="Time limit" value={formatTimeLimit(request.timeLimit)} />
            )}
            {request.expiresAt && (
              <DetailRow
                label="Expires at"
                value={formatDateTime(request.expiresAt)}
                accent={expired ? "text-rose-500" : undefined}
              />
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="mb-2 text-[14px] font-semibold tracking-tight text-[var(--foreground)]">
            Timeline
          </p>
          <TimelineItem
            title="Request submitted"
            time={request.requestedAt}
            color="bg-sky-500"
            completed
          />
          {request.status === REQUEST_STATUS.APPROVED && (
            <>
              <TimelineItem
                title="Request approved"
                time={request.approvedAt || new Date()}
                color="bg-emerald-500"
                completed
              />
              {request.expiresAt && (
                <TimelineItem
                  title={expired ? "Access expired" : "Access expires"}
                  time={request.expiresAt}
                  color="bg-amber-500"
                  completed={expired}
                />
              )}
            </>
          )}
          {request.status === REQUEST_STATUS.DENIED && (
            <TimelineItem
              title="Request denied"
              time={request.deniedAt || new Date()}
              color="bg-rose-500"
              completed
            />
          )}
        </div>

        {/* Actions */}
        {request.status === REQUEST_STATUS.PENDING && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowApprove(true)}
              disabled={busy}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Approve Request
            </button>
            <button
              type="button"
              onClick={() => setShowDeny(true)}
              disabled={busy}
              className="w-full rounded-2xl bg-rose-500 px-4 py-3.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Deny Request
            </button>
          </div>
        )}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="w-full rounded-2xl border border-rose-500/30 bg-transparent px-4 py-3 text-[13px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete Request
          </button>
        ) : (
          <div className="space-y-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
            <p className="text-[13px] font-semibold text-[var(--foreground)]">
              Delete this request?
            </p>
            <p className="text-[12px] text-[var(--muted)]">
              This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[13px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>

      <ApprovalFormModal
        open={showApprove}
        onClose={() => setShowApprove(false)}
        request={request}
        childName={childName}
        onApproved={onChanged}
      />
      <DenialFormModal
        open={showDeny}
        onClose={() => setShowDeny(false)}
        request={request}
        childName={childName}
        onDenied={onChanged}
      />
    </div>
  );
}
