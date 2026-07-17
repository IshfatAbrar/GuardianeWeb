"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchAllModules,
  listenToAssignments,
  ASSIGNMENT_PRIORITY,
  ASSIGNMENT_STATUS,
  effectiveAssignmentStatus,
  isAssignmentOverdue,
  isAssignmentCompleted,
  progressFor,
  fetchLearningProgressForChildren,
} from "../../lib/learningModules";
import { AssignmentFormModal } from "./assignment-form-modal";
import { AssignmentDetailView } from "./assignment-detail-view";

const STATUS_OPTIONS = [
  { id: null, label: "All status" },
  { id: ASSIGNMENT_STATUS.ASSIGNED, label: "Assigned" },
  { id: ASSIGNMENT_STATUS.IN_PROGRESS, label: "In progress" },
  { id: ASSIGNMENT_STATUS.COMPLETED, label: "Completed" },
  { id: ASSIGNMENT_STATUS.OVERDUE, label: "Overdue" },
];

const PRIORITY_OPTIONS = [
  { id: null, label: "All priority" },
  { id: ASSIGNMENT_PRIORITY.LOW, label: "Low" },
  { id: ASSIGNMENT_PRIORITY.MEDIUM, label: "Medium" },
  { id: ASSIGNMENT_PRIORITY.HIGH, label: "High" },
];

const STATUS_META = {
  [ASSIGNMENT_STATUS.ASSIGNED]: { label: "Assigned", className: "bg-sky-500/15 text-sky-500" },
  [ASSIGNMENT_STATUS.IN_PROGRESS]: { label: "In progress", className: "bg-amber-500/15 text-amber-500" },
  [ASSIGNMENT_STATUS.COMPLETED]: { label: "Completed", className: "bg-emerald-500/15 text-emerald-500" },
  [ASSIGNMENT_STATUS.OVERDUE]: { label: "Overdue", className: "bg-rose-500/15 text-rose-500" },
};

const PRIORITY_DOT = {
  [ASSIGNMENT_PRIORITY.LOW]: "bg-emerald-500",
  [ASSIGNMENT_PRIORITY.MEDIUM]: "bg-amber-500",
  [ASSIGNMENT_PRIORITY.HIGH]: "bg-rose-500",
};

function formatDate(value) {
  if (!value) return null;
  try {
    const d = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
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

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className={`text-3xl font-semibold leading-none tracking-tight ${accent}`}>
        {value}
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </p>
    </div>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

function AssignmentCard({ assignment, childName, moduleTitle, progressById, onOpen }) {
  const effStatus = effectiveAssignmentStatus(assignment, progressById);
  const statusMeta = STATUS_META[effStatus] || STATUS_META[ASSIGNMENT_STATUS.ASSIGNED];
  const priorityDot = PRIORITY_DOT[assignment.priority] || PRIORITY_DOT[ASSIGNMENT_PRIORITY.MEDIUM];
  const overdue = isAssignmentOverdue(assignment, progressById);
  const dueText = assignment.dueDate ? formatDate(assignment.dueDate) : null;
  const progress = progressFor(assignment, progressById);
  const pct = Math.round(progress * 100);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            Assigned to {childName}
          </p>
          <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-[var(--foreground)]">
            {moduleTitle}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            assignment.priority === ASSIGNMENT_PRIORITY.HIGH ? "bg-rose-500/15 text-rose-500" :
            assignment.priority === ASSIGNMENT_PRIORITY.LOW ? "bg-emerald-500/15 text-emerald-500" :
            "bg-amber-500/15 text-amber-500"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot}`} />
            {assignment.priority || "medium"}
          </span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>{pct}% complete</span>
          {dueText && (
            <span className={overdue ? "text-rose-500" : ""}>
              {overdue ? "Overdue · " : "Due "}
              {dueText}
            </span>
          )}
        </div>
        <ProgressBar value={progress} />
      </div>
    </button>
  );
}

function EmptyState({ onAssign, hasFilters, onClear }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
      <p className="text-sm font-medium text-[var(--foreground)]">
        No assignments to show
      </p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">
        {hasFilters
          ? "Try clearing filters, or assign a new module."
          : "Assign learning modules to your children to get started."}
      </p>
      <div className="mt-3 flex justify-center gap-2">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-[12px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          onClick={onAssign}
          className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-[12px] font-semibold text-white"
        >
          Assign Module
        </button>
      </div>
    </div>
  );
}

export function ModulesTab({ data }) {
  const { user } = useAuth();
  const parentId = user?.uid;

  const [assignments, setAssignments] = useState([]);
  // Progress lives in a separate collection written by the child's device, so
  // it is joined in by assignment key rather than read off the assignment row.
  const [progressById, setProgressById] = useState(() => new Map());
  const [modules, setModules] = useState([]);
  const [listenerErr, setListenerErr] = useState(null);

  const [statusFilter, setStatusFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState(null);
  const [childFilter, setChildFilter] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);

  // Modules — one-shot fetch (rare changes, refresh on assign)
  const refreshModules = useCallback(async () => {
    try {
      const rows = await fetchAllModules();
      setModules(rows);
    } catch (err) {
      console.error("[modules-tab] failed to fetch modules", err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllModules()
      .then((rows) => {
        if (!cancelled) setModules(rows);
      })
      .catch((err) => console.error("[modules-tab] failed to fetch modules", err));
    return () => {
      cancelled = true;
    };
  }, []);

  // Assignments — real-time listener matching iOS
  useEffect(() => {
    if (!parentId) return undefined;
    const unsub = listenToAssignments(
      parentId,
      (rows) => {
        setAssignments(rows);
        setListenerErr(null);
      },
      (err) => setListenerErr(err.message || "Failed to load assignments"),
    );
    return unsub;
  }, [parentId]);

  // Progress for every child, keyed by `{childId}_{moduleId}`. Keyed on a
  // joined id string so re-fetching children with the same ids doesn't refetch.
  const childIdsKey = (data?.children || []).map((c) => c.id).sort().join(",");
  useEffect(() => {
    if (!childIdsKey) return undefined;
    let cancelled = false;
    fetchLearningProgressForChildren(childIdsKey.split(","))
      .then((map) => {
        if (!cancelled) setProgressById(map);
      })
      .catch((err) => console.error("[modules-tab] failed to fetch progress", err));
    return () => {
      cancelled = true;
    };
    // assignments.length: a just-assigned module can already have progress from
    // an earlier assignment, so re-read when the assignment set changes.
  }, [childIdsKey, assignments.length]);

  const childList = useMemo(() => data?.children || [], [data?.children]);
  const childById = useMemo(() => {
    const m = new Map();
    for (const c of childList) m.set(c.id, c);
    return m;
  }, [childList]);
  const moduleById = useMemo(() => {
    const m = new Map();
    for (const mod of modules) m.set(mod.id, mod);
    return m;
  }, [modules]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter) {
        if (effectiveAssignmentStatus(a, progressById) !== statusFilter) return false;
      }
      if (priorityFilter && a.priority !== priorityFilter) return false;
      if (childFilter && a.childId !== childFilter) return false;
      return true;
    });
  }, [assignments, progressById, statusFilter, priorityFilter, childFilter]);

  // Stats — from unfiltered assignments to match iOS behavior
  const stats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a) => isAssignmentCompleted(a, progressById)).length;
    const pending = total - completed;
    const overdue = assignments.filter((a) => isAssignmentOverdue(a, progressById)).length;
    const avgProgress = total === 0
      ? 0
      : assignments.reduce((sum, a) => sum + progressFor(a, progressById), 0) / total;
    return { total, completed, pending, overdue, avgProgress };
  }, [assignments, progressById]);

  const hasFilters = !!(statusFilter || priorityFilter || childFilter);
  function clearFilters() {
    setStatusFilter(null);
    setPriorityFilter(null);
    setChildFilter(null);
  }

  const activeAssignment = useMemo(
    () => assignments.find((a) => a.id === activeAssignmentId) || null,
    [assignments, activeAssignmentId],
  );

  // Inline detail view
  if (activeAssignment) {
    return (
      <AssignmentDetailView
        assignment={activeAssignment}
        module={moduleById.get(activeAssignment.moduleId)}
        child={childById.get(activeAssignment.childId)}
        progressById={progressById}
        onBack={() => setActiveAssignmentId(null)}
        onChanged={() => {
          /* listener handles updates automatically */
        }}
      />
    );
  }

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
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          disabled={!parentId}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          Assign Module
        </button>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="flex flex-col gap-5 p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} accent="text-[var(--accent)]" />
          <StatCard label="Completed" value={stats.completed} accent="text-emerald-500" />
          <StatCard
            label="Avg Progress"
            value={`${Math.round(stats.avgProgress * 100)}%`}
            accent="text-amber-500"
          />
          <StatCard label="Overdue" value={stats.overdue} accent="text-rose-500" />
        </div>

        {/* Quick assign card */}
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          disabled={!parentId}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)] p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 [&>div]:hover:[&_p]:text-white"
        >
          <div className="space-y-0.5">
            <p className="text-[14px] font-semibold text-[var(--accent)]">
              Assign New Module
            </p>
            <p className="text-[12px] text-[var(--muted)]">
              Help your child learn digital safety
            </p>
          </div>
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
        </button>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Filters
          </p>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={PRIORITY_OPTIONS} />
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
            {filtered.length} of {assignments.length}
          </span>
        </div>

        {listenerErr && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-[12.5px] text-[var(--danger)]">
            {listenerErr}
          </div>
        )}

        {/* Assignments grid */}
        {filtered.length === 0 ? (
          <EmptyState
            onAssign={() => setAssignOpen(true)}
            hasFilters={hasFilters}
            onClear={clearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                childName={childById.get(a.childId)?.name || "—"}
                moduleTitle={moduleById.get(a.moduleId)?.title || "—"}
                progressById={progressById}
                onOpen={() => setActiveAssignmentId(a.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AssignmentFormModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={refreshModules}
        childList={childList}
        modules={modules}
        parentId={parentId}
      />
    </div>
  );
}
