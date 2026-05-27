"use client";

import { useState } from "react";
import { AssignModuleModal } from "./assign-module-modal";

const CHILDREN = [
  { id: "cowey", name: "Cowey" },
  { id: "emma", name: "Emma" },
  { id: "liam", name: "Liam" },
  { id: "sophia", name: "Sophia" },
];

const MODULES = [
  { id: "cyberbullying", title: "Cyberbullying" },
  { id: "online-safety", title: "Online Safety" },
  { id: "privacy-protection", title: "Privacy Protection" },
  { id: "digital-wellness", title: "Digital Wellness" },
  { id: "social-media", title: "Social Media Literacy" },
  { id: "mindful-tech", title: "Mindful Tech Use" },
];

const SEED_ASSIGNMENTS = [
  {
    id: "a1",
    childId: "emma",
    moduleId: "online-safety",
    priority: "High",
    dueDate: "2026-06-12",
    status: "in-progress",
    progress: 60,
  },
  {
    id: "a2",
    childId: "liam",
    moduleId: "cyberbullying",
    priority: "Medium",
    dueDate: "2026-06-04",
    status: "assigned",
    progress: 0,
  },
  {
    id: "a3",
    childId: "sophia",
    moduleId: "digital-wellness",
    priority: "Low",
    dueDate: null,
    status: "completed",
    progress: 100,
  },
];

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

const PRIORITY_DOT = {
  Low: "bg-[var(--muted)]",
  Medium: "bg-[var(--accent)]",
  High: "bg-[var(--danger)]",
};

function formatDate(iso) {
  if (!iso) return "No due date";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function childName(id) {
  return CHILDREN.find((c) => c.id === id)?.name || "—";
}

function moduleTitle(id) {
  return MODULES.find((m) => m.id === id)?.title || "—";
}

function ProgressBar({ value }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function AssignmentCard({ assignment }) {
  const status = STATUS_META[assignment.status] || STATUS_META.assigned;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent-border)] hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
            {childName(assignment.childId)}
          </p>
          <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            {moduleTitle(assignment.moduleId)}
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
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              PRIORITY_DOT[assignment.priority]
            }`}
          />
          {assignment.priority} priority
        </span>
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
          {formatDate(assignment.dueDate)}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>Progress</span>
          <span>{assignment.progress}%</span>
        </div>
        <ProgressBar value={assignment.progress} />
      </div>
    </div>
  );
}

function StatsRow({ assignments }) {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const inProgress = assignments.filter((a) => a.status === "in-progress")
    .length;
  const assigned = assignments.filter((a) => a.status === "assigned").length;

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

export function ModulesTab() {
  const [assignments, setAssignments] = useState(SEED_ASSIGNMENTS);
  const [assignOpen, setAssignOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "assigned", label: "Assigned" },
    { id: "in-progress", label: "In progress" },
    { id: "completed", label: "Completed" },
  ];

  const visible =
    filter === "all"
      ? assignments
      : assignments.filter((a) => a.status === filter);

  function handleAssign(newAssignment) {
    setAssignments((prev) => [newAssignment, ...prev]);
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
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5"
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

        {/* Assignments grid */}
        {visible.length === 0 ? (
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
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </div>

      <AssignModuleModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
      />
    </div>
  );
}
