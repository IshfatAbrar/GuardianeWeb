"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  assignModuleToChild,
  MODULE_CATEGORIES,
} from "../../lib/learningModules";

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

export function AssignModuleModal({
  open,
  onClose,
  onAssigned,
  childList = [],
  modules = [],
  parentId,
}) {
  const [childId, setChildId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const canAssign = !!(childId && moduleId && parentId && !submitting);

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
      setSubmitting(false);
      setErrorMessage(null);
    }
  }, [open]);

  async function handleSubmit() {
    if (!canAssign) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const chosen = modules.find((m) => m.id === moduleId);
      await assignModuleToChild({
        parentId,
        childId,
        moduleId,
        category: chosen?.category || MODULE_CATEGORIES.CHILD,
      });
      onAssigned?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to assign module");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

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
                No modules to assign yet. Create one from the Learning Modules tab first.
              </p>
            ) : (
              <SelectField
                value={moduleId}
                onChange={setModuleId}
                options={moduleOptions}
                placeholder="Choose a module"
              />
            )}
          </FieldGroup>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
