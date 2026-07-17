"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  RELATIONSHIP_OPTIONS,
} from "../../lib/emergencyContacts";

const inputCls =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[13.5px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent-border)]";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-[var(--foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function EmergencyContactFormModal({ open, onClose, parentUid, contact = null }) {
  if (!open || typeof document === "undefined") return null;
  return <Content onClose={onClose} parentUid={parentUid} contact={contact} />;
}

function Content({ onClose, parentUid, contact }) {
  const editing = !!contact?.id;

  const [name, setName] = useState(contact?.name || "");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [relationship, setRelationship] = useState(
    contact?.relationship || RELATIONSHIP_OPTIONS[0],
  );
  const [notes, setNotes] = useState(contact?.notes || "");
  const [isEmergency, setIsEmergency] = useState(contact?.isEmergency !== false);
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

  const canSave = !!name.trim() && !!phone.trim() && !submitting;

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = { name, phone, relationship, notes, isEmergency };
      if (editing) {
        await updateEmergencyContact(contact.id, payload);
      } else {
        await createEmergencyContact({ parentId: parentUid, ...payload });
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to save");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await deleteEmergencyContact(contact.id);
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
        aria-labelledby="ec-form-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1
              id="ec-form-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              {editing ? "Edit contact" : "Add emergency contact"}
            </h1>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <Field label="Name">
            <input
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>

          <Field label="Phone number">
            <input
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              inputMode="tel"
            />
          </Field>

          <Field label="Relationship">
            <select
              className={inputCls}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              {RELATIONSHIP_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Notes (optional)">
            <textarea
              className={`${inputCls} min-h-[72px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything your child should know before calling"
            />
          </Field>

          <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <input
              type="checkbox"
              checked={isEmergency}
              onChange={(e) => setIsEmergency(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-[var(--foreground)]">
                Show on your child&apos;s emergency screen
              </span>
              <span className="block text-[11.5px] text-[var(--muted)]">
                Your child can call this contact directly from their app.
              </span>
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 pt-1">
            {editing ? (
              <button
                type="button"
                onClick={() => (confirmDelete ? handleDelete() : setConfirmDelete(true))}
                disabled={submitting}
                className="rounded-lg border border-rose-500/40 px-3 py-2 text-[12.5px] font-semibold text-rose-500 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
              >
                {confirmDelete ? "Tap again to confirm" : "Delete"}
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-[12.5px] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving…" : editing ? "Save" : "Add contact"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
