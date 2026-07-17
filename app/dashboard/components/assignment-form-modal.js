"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  assignModule,
  ASSIGNMENT_PRIORITY,
} from "../../lib/learningModules";

const PRIORITIES = [
  { id: ASSIGNMENT_PRIORITY.LOW, label: "Low", dot: "bg-emerald-500" },
  { id: ASSIGNMENT_PRIORITY.MEDIUM, label: "Medium", dot: "bg-amber-500" },
  { id: ASSIGNMENT_PRIORITY.HIGH, label: "High", dot: "bg-rose-500" },
];

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
        checked ? "bg-[var(--accent)]" : "border border-[var(--border)] bg-[var(--surface-muted)]"
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

function ModulePreview({ module }) {
  if (!module) return null;
  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--foreground)]">
            {module.title}
          </p>
          <p className="text-[11.5px] capitalize text-[var(--muted)]">
            {module.category || "—"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-[11px] text-[var(--muted)]">
          <span className="text-amber-500">
            {"★".repeat(Math.max(0, Math.min(5, module.difficulty || 1)))}
          </span>
          <span>
            {Math.round((module.estimatedDuration || 0) / 60)} min
          </span>
        </div>
      </div>
      {module.description && (
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-[var(--muted)]">
          {module.description}
        </p>
      )}
    </div>
  );
}

function toDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInputValue(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function AssignmentFormModal({
  open,
  onClose,
  onAssigned,
  childList = [],
  modules = [],
  parentId,
  initialModuleId = "",
}) {
  if (!open || typeof document === "undefined") return null;
  return (
    <FormContent
      onClose={onClose}
      onAssigned={onAssigned}
      childList={childList}
      modules={modules}
      parentId={parentId}
      initialModuleId={initialModuleId}
    />
  );
}

function FormContent({
  onClose,
  onAssigned,
  childList,
  modules,
  parentId,
  initialModuleId,
}) {
  const [childId, setChildId] = useState(childList[0]?.id || "");
  const [moduleId, setModuleId] = useState(initialModuleId || "");
  const [priority, setPriority] = useState(ASSIGNMENT_PRIORITY.MEDIUM);

  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(() =>
    toDateInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );

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

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === moduleId) || null,
    [modules, moduleId],
  );

  const canAssign = !!(childId && moduleId && parentId && !submitting);

  async function handleSubmit() {
    if (!canAssign) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const parsed = hasDueDate ? parseDateInputValue(dueDate) : null;
      await assignModule({
        moduleId,
        childId,
        parentId,
        priority,
        dueDate: parsed,
      });
      onAssigned?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to assign module");
    } finally {
      setSubmitting(false);
    }
  }

  function applyQuick(option) {
    const now = new Date();
    let target = now;
    if (option === "today") target = now;
    else if (option === "tomorrow") {
      target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (option === "nextWeek") {
      target = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    setHasDueDate(true);
    setDueDate(toDateInputValue(target));
  }

  const childOptions = childList.map((c) => ({ id: c.id, label: c.name || "Child" }));
  const moduleOptions = modules.map((m) => ({ id: m.id, label: m.title || "Untitled" }));

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assignment-form-title"
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
              id="assignment-form-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
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
              {submitting ? "Saving…" : "Assign"}
            </button>
          </div>

          <div className="h-px w-full bg-[var(--border)]" />

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <FieldGroup label="Child">
            {childOptions.length === 0 ? (
              <p className="text-[12.5px] text-[var(--muted)]">
                No children on file yet — add children from settings first.
              </p>
            ) : (
              <SelectField
                value={childId}
                onChange={setChildId}
                options={childOptions}
                placeholder="Select a child"
              />
            )}
          </FieldGroup>

          <FieldGroup label="Learning Module">
            {moduleOptions.length === 0 ? (
              <p className="text-[12.5px] text-[var(--muted)]">
                No modules to assign. Create one from the Learning Hub.
              </p>
            ) : (
              <>
                <SelectField
                  value={moduleId}
                  onChange={setModuleId}
                  options={moduleOptions}
                  placeholder="Choose a module"
                />
                <ModulePreview module={selectedModule} />
              </>
            )}
          </FieldGroup>

          <FieldGroup label="Priority">
            <div
              role="radiogroup"
              aria-label="Priority"
              className="inline-flex w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1"
            >
              {PRIORITIES.map((p) => {
                const active = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPriority(p.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
                      active
                        ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </FieldGroup>

          <FieldGroup label="Due Date">
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[14px] font-medium text-[var(--foreground)]">
                  Set Due Date
                </span>
                <Toggle checked={hasDueDate} onChange={setHasDueDate} />
              </div>

              {hasDueDate && (
                <>
                  <input
                    type="date"
                    value={dueDate}
                    min={toDateInputValue(new Date())}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[13.5px] text-[var(--foreground)] focus:border-[var(--accent-border)] focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "today", label: "Today" },
                      { id: "tomorrow", label: "Tomorrow" },
                      { id: "nextWeek", label: "Next Week" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => applyQuick(opt.id)}
                        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[11.5px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </FieldGroup>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
