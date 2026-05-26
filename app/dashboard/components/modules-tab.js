"use client";

import { useState } from "react";

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

const PRIORITIES = ["Low", "Medium", "High"];

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

function ListView({ assignments, onAssign }) {
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

  return (
    <div className="space-y-7 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
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
          onClick={onAssign}
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

      <StatsRow assignments={assignments} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
  );
}

function FieldGroup({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] transition-colors focus-within:border-[var(--accent-border)]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 pr-10 text-[14px] text-[var(--foreground)] focus:outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
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
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked
          ? "bg-[var(--accent)]"
          : "border border-[var(--border)] bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function AssignView({ onCancel, onAssign }) {
  const [childId, setChildId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const canAssign = childId && moduleId;

  function handleSubmit() {
    if (!canAssign) return;
    onAssign({
      id: `a-${Date.now()}`,
      childId,
      moduleId,
      priority,
      dueDate: hasDueDate ? dueDate : null,
      status: "assigned",
      progress: 0,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-[14px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
          Assign Module
        </h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canAssign}
          className={`text-[14px] font-semibold transition-colors ${
            canAssign
              ? "text-[var(--accent)] hover:text-[var(--accent-hover)]"
              : "cursor-not-allowed text-[var(--muted)]"
          }`}
        >
          Assign
        </button>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      {/* Child */}
      <FieldGroup label="Child">
        <SelectField
          value={childId}
          onChange={setChildId}
          options={CHILDREN.map((c) => ({ id: c.id, label: c.name }))}
          placeholder="Select a child"
        />
      </FieldGroup>

      {/* Module */}
      <FieldGroup label="Learning Module">
        <SelectField
          value={moduleId}
          onChange={setModuleId}
          options={MODULES.map((m) => ({ id: m.id, label: m.title }))}
          placeholder="Choose a module"
        />
      </FieldGroup>

      {/* Priority */}
      <FieldGroup label="Priority">
        <div
          role="radiogroup"
          aria-label="Priority"
          className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
        >
          {PRIORITIES.map((p) => {
            const active = priority === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPriority(p)}
                className={`rounded-lg px-6 py-2 text-[13px] font-semibold transition-all ${
                  active
                    ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </FieldGroup>

      {/* Due Date */}
      <FieldGroup label="Due Date">
        <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              Set Due Date
            </span>
            <Toggle checked={hasDueDate} onChange={setHasDueDate} />
          </div>
          {hasDueDate && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[13.5px] text-[var(--foreground)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          )}
        </div>
      </FieldGroup>
    </div>
  );
}

export function ModulesTab() {
  const [view, setView] = useState("list");
  const [assignments, setAssignments] = useState(SEED_ASSIGNMENTS);

  function handleAssign(newAssignment) {
    setAssignments((prev) => [newAssignment, ...prev]);
    setView("list");
  }

  return view === "list" ? (
    <ListView
      assignments={assignments}
      onAssign={() => setView("assign")}
    />
  ) : (
    <AssignView
      onCancel={() => setView("list")}
      onAssign={handleAssign}
    />
  );
}
