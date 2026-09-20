"use client";

// Draft data page for the "View all" link on Crisis Management's Risk alerts
// card. Family-wide (every child, not just the one selected in the sidebar),
// with a searchbar + filters — a first pass Han asked for to iterate on
// visually from here, not a finished view.

import { useMemo, useState } from "react";

const SEVERITY_META = {
  critical: {
    label: "Critical",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.16)",
  },
  warning: {
    label: "Warning",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.16)",
  },
  info: { label: "Info", color: "#0284c7", bg: "rgba(2, 132, 199, 0.16)" },
};

function fullTime(ts) {
  const ms = ts?.toMillis?.();
  if (typeof ms !== "number") return "—";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function SeverityBadge({ severity }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.info;
  return (
    <span
      className="inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function Select({ value, onChange, options, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-[12.5px] font-medium text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p
        className={`text-3xl font-semibold leading-none tracking-tight ${accent}`}
      >
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

export function RiskAlertsPage({ alerts, childList, onBack }) {
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const childById = useMemo(() => {
    const m = new Map();
    for (const c of childList) m.set(c.id, c);
    return m;
  }, [childList]);

  // Stats over the full family-wide set — deliberately unaffected by the
  // search/filter controls below, same as Module Assignments' stat row.
  const stats = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let unread = 0;
    for (const a of alerts) {
      if (a.severity === "critical") critical += 1;
      else if (a.severity === "warning") warning += 1;
      if (!a.isRead) unread += 1;
    }
    return { total: alerts.length, critical, warning, unread };
  }, [alerts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((a) => {
      if (childFilter !== "all" && a.childId !== childFilter) return false;
      if (severityFilter !== "all" && a.severity !== severityFilter)
        return false;
      if (statusFilter === "unread" && a.isRead) return false;
      if (statusFilter === "read" && !a.isRead) return false;
      if (!q) return true;
      const childName = childById.get(a.childId)?.name || "";
      return (
        a.type?.toLowerCase().includes(q) ||
        a.message?.toLowerCase().includes(q) ||
        childName.toLowerCase().includes(q)
      );
    });
  }, [alerts, search, childFilter, severityFilter, statusFilter, childById]);

  const childOptions = [
    { value: "all", label: "All children" },
    ...childList.map((c) => ({ value: c.id, label: c.name || "Child" })),
  ];
  const severityOptions = [
    { value: "all", label: "All severities" },
    { value: "critical", label: "Critical" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
  ];
  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 p-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Crisis Management
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            All Risk Alerts
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Flagged on your children&apos;s devices by on-device analysis
          </p>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total"
            value={stats.total}
            accent="text-[var(--accent)]"
          />
          <StatCard
            label="Critical"
            value={stats.critical}
            accent="text-rose-500"
          />
          <StatCard
            label="Warning"
            value={stats.warning}
            accent="text-amber-500"
          />
          <StatCard label="Unread" value={stats.unread} accent="text-sky-500" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by child, type, or message…"
              aria-label="Search risk alerts"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-muted)] py-2 pl-8 pr-3 text-[12.5px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)]"
            />
          </div>
          <Select
            value={childFilter}
            onChange={setChildFilter}
            options={childOptions}
            ariaLabel="Filter by child"
          />
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            options={severityOptions}
            ariaLabel="Filter by severity"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            ariaLabel="Filter by status"
          />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-[13px] font-bold text-[var(--foreground)]">
              {filtered.length} alert{filtered.length === 1 ? "" : "s"}
            </h2>
          </div>

          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-[var(--muted)]">
              No risk alerts match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    <th className="px-4 py-2.5 font-semibold">Severity</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Child</th>
                    <th className="px-4 py-2.5 font-semibold">Message</th>
                    <th className="px-4 py-2.5 font-semibold">Time</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-[var(--border)] align-top last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <SeverityBadge severity={a.severity} />
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--foreground)]">
                        {a.type}
                      </td>
                      <td className="px-4 py-3 text-[var(--foreground)]">
                        {childById.get(a.childId)?.name || "—"}
                      </td>
                      <td className="max-w-[420px] px-4 py-3 text-[var(--muted)]">
                        <span className="line-clamp-2">{a.message}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                        {fullTime(a.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            a.isRead
                              ? "bg-[var(--surface-muted)] text-[var(--muted)]"
                              : "bg-[var(--accent-bg)] text-[var(--accent)]"
                          }`}
                        >
                          {a.isRead ? "Read" : "New"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
