"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { updateUserProfile } from "../../lib/database";

export function EditNameModal({ open, onClose, currentName, uid, onSaved }) {
  if (!open || typeof document === "undefined") return null;
  return (
    <Content
      onClose={onClose}
      currentName={currentName}
      uid={uid}
      onSaved={onSaved}
    />
  );
}

function Content({ onClose, currentName, uid, onSaved }) {
  const [name, setName] = useState(currentName || "");
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

  const canSave = !!name.trim() && name.trim() !== currentName && !submitting;

  async function handleSave() {
    if (!canSave || !uid) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const trimmed = name.trim();
      await updateUserProfile(uid, { name: trimmed });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed }).catch(() => {});
      }
      onSaved?.(trimmed);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update name");
    } finally {
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
        aria-labelledby="edit-name-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
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
            <h1 id="edit-name-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Edit Name
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

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Full name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
