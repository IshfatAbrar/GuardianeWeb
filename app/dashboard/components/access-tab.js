"use client";

import { useMemo, useState } from "react";

const SEED_REQUESTS = [
  {
    id: "r1",
    child: "Ethan",
    target: "Install TikTok",
    reason: "My friends use it for our school project.",
    status: "pending",
    requestedAt: "2026-05-18T17:13:00",
  },
  {
    id: "r2",
    child: "Lily",
    target: "Extra 30 min screen time",
    reason: "Finishing the last episode with mom.",
    status: "pending",
    requestedAt: "2026-05-17T17:13:00",
  },
  {
    id: "r3",
    child: "Ethan",
    target: "Add Jake R. as a contact",
    reason: "He's on my soccer team.",
    status: "denied",
    requestedAt: "2026-05-15T17:13:00",
  },
  {
    id: "r4",
    child: "Lily",
    target: "Roblox Premium Pass",
    reason: "Want to unlock weekend skins.",
    status: "approved",
    requestedAt: "2026-05-14T11:24:00",
  },
];

const STATUS_COLOR = {
  pending: { fg: "#F59E0B", bg: "rgba(245, 158, 11, 0.14)" },
  approved: { fg: "#10B981", bg: "rgba(16, 185, 129, 0.14)" },
  denied: { fg: "#EF4444", bg: "rgba(239, 68, 68, 0.14)" },
};

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

const AVATAR_PALETTE = [
  { fg: "#3B82F6", bg: "rgba(59, 130, 246, 0.16)" },
  { fg: "#A855F7", bg: "rgba(168, 85, 247, 0.16)" },
  { fg: "#EC4899", bg: "rgba(236, 72, 153, 0.16)" },
  { fg: "#10B981", bg: "rgba(16, 185, 129, 0.16)" },
];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  } catch {
    return iso;
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
  const c = STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
      <p
        className="text-3xl font-semibold leading-none tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      <p className="mt-2 text-[12px] font-medium text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

function RequestCard({ request, onApprove, onDeny }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--accent-border)]">
      <div className="flex items-start gap-4">
        <Avatar name={request.child} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-[var(--foreground)]">
              {request.child}
            </p>
            <StatusPill status={request.status} />
          </div>
          <p className="mt-0.5 text-[14px] text-[var(--foreground)]">
            {request.target}
          </p>
          {request.reason && (
            <p className="mt-1 text-[12.5px] text-[var(--muted)]">
              {request.reason}
            </p>
          )}
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            {formatDate(request.requestedAt)}
          </p>
        </div>
      </div>

      {request.status === "pending" && (
        <div className="mt-1 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onDeny(request.id)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => onApprove(request.id)}
            className="rounded-full bg-[#10B981] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#0EA371]"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

export function AccessTab() {
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const approved = requests.filter((r) => r.status === "approved").length;
    const denied = requests.filter((r) => r.status === "denied").length;
    return { total, pending, approved, denied };
  }, [requests]);

  const visible =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  function handleApprove(id) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
  }

  function handleDeny(id) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "denied" } : r)),
    );
  }

  const filters = [
    { id: "all", label: "All", count: counts.total },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "approved", label: "Approved", count: counts.approved },
    { id: "denied", label: "Denied", count: counts.denied },
  ];

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

      <div className="flex flex-col gap-6 p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={counts.total} label="Total" color="#3B82F6" />
          <StatCard value={counts.pending} label="Pending" color="#F59E0B" />
          <StatCard value={counts.approved} label="Approved" color="#10B981" />
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {f.label}
                <span
                  className={`text-[11px] ${
                    active ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No requests to show
            </p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              Try a different filter.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
