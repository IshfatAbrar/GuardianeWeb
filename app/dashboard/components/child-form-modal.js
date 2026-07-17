"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createChild, updateChild, deleteChild } from "../../lib/database";

const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];

const GRADES = [
  "Pre-K", "Kindergarten",
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade",
  "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
];

function fromBirthDateString(value) {
  if (!value) return "";
  // Stored as "MM/DD/YYYY" per database.js conversion
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  return "";
}

export function ChildFormModal({
  open,
  onClose,
  onSaved,
  child = null,
  parentUid,
}) {
  if (!open || typeof document === "undefined") return null;
  return (
    <Content
      onClose={onClose}
      onSaved={onSaved}
      child={child}
      parentUid={parentUid}
    />
  );
}

function Content({ onClose, onSaved, child, parentUid }) {
  const editing = !!child?.id;

  const [name, setName] = useState(child?.name || "");
  const [bday, setBday] = useState(fromBirthDateString(child?.birthDate));
  const [gender, setGender] = useState(child?.gender || "");
  const [grade, setGrade] = useState(child?.grade || "");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const canSave = !!name.trim() && !submitting;

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (editing) {
        // Empty strings, not nulls: GuardParent's own edit form writes "" for
        // blank optional fields, and its screens render the value directly.
        const patch = {
          name: name.trim(),
          gender: gender || "",
          grade: grade || "",
        };
        if (bday) {
          const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bday);
          if (m) patch.birthDate = `${m[2]}/${m[3]}/${m[1]}`;
        }
        await updateChild(child.id, patch);
      } else {
        await createChild({
          parentUid,
          name,
          bday,
          gender: gender || "",
          grade: grade || "",
        });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await deleteChild(child.id, parentUid);
      onSaved?.();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to delete");
      setSubmitting(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-form-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-5 p-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-[14px] font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
            >
              Cancel
            </button>
            <h1
              id="child-form-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              {editing ? "Edit Child" : "Add Child"}
            </h1>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`text-[14px] font-semibold transition-colors ${
                canSave
                  ? "text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  : "cursor-not-allowed text-[var(--muted)]"
              }`}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="h-px w-full bg-[var(--border)]" />

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter child's name"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Date of Birth
            </label>
            <input
              type="date"
              value={bday}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setBday(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Gender
            </label>
            <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent-border)]">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 pr-10 text-[14px] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <svg aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--accent)]" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Grade
            </label>
            <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent-border)]">
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 pr-10 text-[14px] text-[var(--foreground)] focus:outline-none"
              >
                <option value="">Select grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <svg aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--accent)]" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {editing && (
            <div className="pt-2">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={submitting}
                  className="w-full rounded-xl border border-rose-500/30 bg-transparent px-4 py-2.5 text-[13px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove Child
                </button>
              ) : (
                <div className="space-y-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                  <p className="text-[13px] font-semibold text-[var(--foreground)]">
                    Remove {child.name}?
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    Their profile and family link will be deleted. Their device
                    will no longer be linked to your account.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={submitting}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12.5px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-rose-500 px-3 py-2 text-[12.5px] font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Removing…" : "Remove"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
