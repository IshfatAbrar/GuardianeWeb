"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AssignModuleModal } from "./assign-module-modal";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAllModules,
  getAssignmentsForParent,
} from "../../lib/learningModules";

const STATUS_META = {
  assigned: {
    label: "Assigned",
    className:
      "border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]",
  },
  "in-progress": {
    label: "In progress",
    className:
      "border border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]",
  },
  completed: {
    label: "Completed",
    className: "border border-transparent bg-[var(--accent)] text-white",
  },
};

function statusFor(assignment) {
  if (assignment.isCompleted) return "completed";
  if ((assignment.progress || 0) > 0) return "in-progress";
  return "assigned";
}

function formatDate(value) {
  if (!value) return "No due date";
  try {
    const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function ProgressBar({ value }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function AssignmentCard({ assignment, childName, moduleTitle }) {
  const status = STATUS_META[statusFor(assignment)] || STATUS_META.assigned;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            {childName}
          </p>
          <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            {moduleTitle}
          </h3>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-medium text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <svg
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          Assigned {formatDate(assignment.assignedAt)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>Progress</span>
          <span>{Math.round((assignment.progress || 0) * 100)}%</span>
        </div>
        <ProgressBar value={assignment.progress || 0} />
      </div>
    </div>
  );
}

function StatsRow({ assignments }) {
  const total = assignments.length;
  const completed = assignments.filter((a) => statusFor(a) === "completed").length;
  const inProgress = assignments.filter((a) => statusFor(a) === "in-progress").length;
  const assigned = assignments.filter((a) => statusFor(a) === "assigned").length;

  const stats = [
    { label: "Total", value: total },
    { label: "Assigned", value: assigned },
    { label: "In progress", value: inProgress },
    { label: "Completed", value: completed },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            {s.label}
          </p>
          <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-[var(--accent)]">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ModulesTab({ data }) {
  const { user } = useAuth();
  const parentId = user?.uid;

  const [assignments, setAssignments] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async () => {
    if (!parentId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const [assignmentRows, moduleRows] = await Promise.all([
        getAssignmentsForParent(parentId),
        fetchAllModules(),
      ]);
      setAssignments(assignmentRows);
      setModules(moduleRows);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load assignments");
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const childList = useMemo(() => data?.children || [], [data?.children]);
  const childById = useMemo(() => {
    const map = new Map();
    for (const c of childList) map.set(c.id, c);
    return map;
  }, [childList]);
  const moduleById = useMemo(() => {
    const map = new Map();
    for (const m of modules) map.set(m.id, m);
    return map;
  }, [modules]);

  const filters = [
    { id: "all", label: "All" },
    { id: "assigned", label: "Assigned" },
    { id: "in-progress", label: "In progress" },
    { id: "completed", label: "Completed" },
  ];

  const visible =
    filter === "all"
      ? assignments
      : assignments.filter((a) => statusFor(a) === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Module Assignments
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Track your children&apos;s progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading || !parentId}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-[12px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            disabled={!parentId}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Assign Module
          </button>
        </div>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="p-6 flex flex-col gap-3">
        <StatsRow assignments={assignments} />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-3">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-[12.5px] text-[var(--danger)]">
            {errorMessage}
          </div>
        )}

        {/* Assignments grid */}
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center text-sm text-[var(--muted)]">
            Loading assignments…
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              No assignments to show
            </p>
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              Try a different filter, or assign a new module.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                childName={childById.get(a.childId)?.name || "—"}
                moduleTitle={moduleById.get(a.moduleId)?.title || "—"}
              />
            ))}
          </div>
        )}
      </div>

      <AssignModuleModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={refresh}
        childList={childList}
        modules={modules}
        parentId={parentId}
      />
    </div>
  );
}
