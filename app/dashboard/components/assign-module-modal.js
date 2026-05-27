"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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

export function AssignModuleModal({ open, onClose, onAssign }) {
  const [childId, setChildId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState("");

  const canAssign = childId && moduleId;

  useEffect(() => {
    if (!open) return undefined;

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
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setChildId("");
      setModuleId("");
      setPriority("Medium");
      setHasDueDate(false);
      setDueDate("");
    }
  }, [open]);

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
    onClose();
  }

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-module-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-7 p-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Cancel
            </button>
            <h1
              id="assign-module-title"
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
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
