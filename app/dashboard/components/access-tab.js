"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listenToAccessRequests,
  effectiveRequestStatus,
  REQUEST_STATUS,
} from "../../lib/accessRequests";
import { ApprovalFormModal } from "./approval-form-modal";
import { DenialFormModal } from "./denial-form-modal";
import { RequestDetailView } from "./request-detail-view";

const STATUS_META = {
  [REQUEST_STATUS.PENDING]: { label: "Pending", className: "bg-amber-500/15 text-amber-500" },
  [REQUEST_STATUS.APPROVED]: { label: "Approved", className: "bg-emerald-500/15 text-emerald-500" },
  [REQUEST_STATUS.DENIED]: { label: "Denied", className: "bg-rose-500/15 text-rose-500" },
  [REQUEST_STATUS.EXPIRED]: { label: "Expired", className: "bg-[var(--surface-muted)] text-[var(--muted)]" },
};

const AVATAR_PALETTE = [
  { fg: "#3B82F6", bg: "rgba(59, 130, 246, 0.16)" },
  { fg: "#A855F7", bg: "rgba(168, 85, 247, 0.16)" },
  { fg: "#EC4899", bg: "rgba(236, 72, 153, 0.16)" },
  { fg: "#10B981", bg: "rgba(16, 185, 129, 0.16)" },
];

function colorForName(name) {
  let hash = 0;
  const s = String(name || "");
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch {
    return "—";
  }
}

function Avatar({ name }) {
  const palette = colorForName(name);
  return (
    <div
      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META[REQUEST_STATUS.PENDING];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function StatCard({ value, label, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
      <p className={`text-3xl font-semibold leading-none tracking-tight ${accent}`}>
        {value}
      </p>
      <p className="mt-2 text-[12px] font-medium text-[var(--muted)]">{label}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative rounded-full border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-[var(--accent-border)]">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="appearance-none rounded-full bg-transparent px-4 py-1.5 pr-8 text-[12px] font-semibold text-[var(--foreground)] focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.id || "all"} value={o.id || ""}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent)]"
        width="12"
        height="12"
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
  );
}

function RequestCard({ request, childName, onOpen, onApprove, onDeny }) {
  const effStatus = effectiveRequestStatus(request);
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent-border)]">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-4 text-left">
        <Avatar name={childName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">
              {request.requestedApp || "—"}
            </p>
            <StatusPill status={effStatus} />
          </div>
          <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
            Requested by {childName || "Unknown"}
          </p>
          {request.reason && (
            <p className="mt-1 line-clamp-2 text-[12.5px] text-[var(--muted)]">
              {request.reason}
            </p>
          )}
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            {formatDateTime(request.requestedAt)}
          </p>
        </div>
      </button>

      {effStatus === REQUEST_STATUS.PENDING && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDeny}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-rose-500 hover:text-rose-500"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={onApprove}
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

export function AccessTab({ data }) {
  const { user } = useAuth();
  const parentId = user?.uid;

  const childList = useMemo(() => data?.children || [], [data?.children]);
  const childIds = useMemo(() => childList.map((c) => c.id), [childList]);
  const childById = useMemo(() => {
    const map = new Map();
    for (const c of childList) map.set(c.id, c);
    return map;
  }, [childList]);

  const [requests, setRequests] = useState([]);
  const [listenerErr, setListenerErr] = useState(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [childFilter, setChildFilter] = useState(null);

  const [activeRequestId, setActiveRequestId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'approve'|'deny', requestId }

  // Real-time listener. Restricts to (a) requests where parentId == uid (iOS)
  // AND (b) childId is in the current family's child ids (the user's request).
  useEffect(() => {
    if (!parentId) return undefined;
    // Don't subscribe until we know the family's children — otherwise the
    // listener would filter to an empty set and look wrongly empty during load.
    if (!data?.children) return undefined;
    const unsub = listenToAccessRequests({
      parentId,
      familyChildIds: childIds,
      onUpdate: (rows) => {
        setRequests(rows);
        setListenerErr(null);
      },
      onError: (err) =>
        setListenerErr(err.message || "Failed to load access requests"),
    });
    return unsub;
  }, [parentId, data?.children, childIds]);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(
      (r) => effectiveRequestStatus(r) === REQUEST_STATUS.PENDING,
    ).length;
    const approved = requests.filter(
      (r) => effectiveRequestStatus(r) === REQUEST_STATUS.APPROVED,
    ).length;
    const denied = requests.filter(
      (r) => effectiveRequestStatus(r) === REQUEST_STATUS.DENIED,
    ).length;
    return { total, pending, approved, denied };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter && effectiveRequestStatus(r) !== statusFilter) return false;
      if (childFilter && r.childId !== childFilter) return false;
      return true;
    });
  }, [requests, statusFilter, childFilter]);

  const hasFilters = !!(statusFilter || childFilter);
  function clearFilters() {
    setStatusFilter(null);
    setChildFilter(null);
  }

  const activeRequest = useMemo(
    () => requests.find((r) => r.id === activeRequestId) || null,
    [requests, activeRequestId],
  );

  const pendingRequest = useMemo(
    () => (pendingAction ? requests.find((r) => r.id === pendingAction.requestId) : null),
    [requests, pendingAction],
  );

  // Inline detail view
  if (activeRequest) {
    return (
      <RequestDetailView
        request={activeRequest}
        childName={childById.get(activeRequest.childId)?.name}
        onBack={() => setActiveRequestId(null)}
        onChanged={() => {
          /* listener handles updates automatically */
        }}
      />
    );
  }

  return (
    <div>
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
          Access Requests
        </h1>
        <p className="mt-0.5 text-sm text-[var(--muted)]">
          Review what your children are asking for
        </p>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="flex flex-col gap-5 p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={stats.total} label="Total" accent="text-[var(--accent)]" />
          <StatCard value={stats.pending} label="Pending" accent="text-amber-500" />
          <StatCard value={stats.approved} label="Approved" accent="text-emerald-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Filters
          </p>
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: null, label: "All status" },
              { id: REQUEST_STATUS.PENDING, label: "Pending" },
              { id: REQUEST_STATUS.APPROVED, label: "Approved" },
              { id: REQUEST_STATUS.DENIED, label: "Denied" },
              { id: REQUEST_STATUS.EXPIRED, label: "Expired" },
            ]}
          />
          <FilterSelect
            value={childFilter}
            onChange={setChildFilter}
            options={[
              { id: null, label: "All children" },
              ...childList.map((c) => ({ id: c.id, label: c.name || "Child" })),
            ]}
          />
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-500/15"
            >
              Clear
            </button>
          )}
          <span className="ml-auto text-[11px] font-medium text-[var(--muted)]">
            {filtered.length} of {requests.length}
          </span>
        </div>

        {listenerErr && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-[12.5px] text-[var(--danger)]">
            {listenerErr}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No access requests
            </p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              {hasFilters
                ? "Try a different filter."
                : "When your children complete learning modules, they can request access to apps."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                childName={childById.get(r.childId)?.name || "Unknown"}
                onOpen={() => setActiveRequestId(r.id)}
                onApprove={() => setPendingAction({ type: "approve", requestId: r.id })}
                onDeny={() => setPendingAction({ type: "deny", requestId: r.id })}
              />
            ))}
          </div>
        )}
      </div>

      <ApprovalFormModal
        open={pendingAction?.type === "approve"}
        onClose={() => setPendingAction(null)}
        request={pendingRequest}
        childName={pendingRequest ? childById.get(pendingRequest.childId)?.name : undefined}
        onApproved={() => setPendingAction(null)}
      />
      <DenialFormModal
        open={pendingAction?.type === "deny"}
        onClose={() => setPendingAction(null)}
        request={pendingRequest}
        childName={pendingRequest ? childById.get(pendingRequest.childId)?.name : undefined}
        onDenied={() => setPendingAction(null)}
      />
    </div>
  );
}
