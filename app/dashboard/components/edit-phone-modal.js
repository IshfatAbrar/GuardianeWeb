"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updateUserProfile } from "../../lib/database";
import { isValidPhone, PHONE_ERROR } from "../../lib/phone";

export function EditPhoneModal({ open, onClose, currentPhone, uid, onSaved }) {
  if (!open || typeof document === "undefined") return null;
  return (
    <Content
      onClose={onClose}
      currentPhone={currentPhone}
      uid={uid}
      onSaved={onSaved}
    />
  );
}

function Content({ onClose, currentPhone, uid, onSaved }) {
  const [phone, setPhone] = useState(currentPhone || "");
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

  const trimmed = phone.trim();
  const canSave = !!trimmed && trimmed !== currentPhone && !submitting;

  async function handleSave() {
    if (!canSave || !uid) return;
    if (!isValidPhone(trimmed)) {
      setErrorMessage(PHONE_ERROR);
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await updateUserProfile(uid, { phone: trimmed });
      onSaved?.(trimmed);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Failed to update phone number");
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
        aria-labelledby="edit-phone-title"
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
            <h1
              id="edit-phone-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              Phone Number
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
            <label
              htmlFor="edit-phone-input"
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
            >
              Phone number
            </label>
            <input
              id="edit-phone-input"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent-border)] focus:outline-none"
            />
            <p className="text-[12px] leading-relaxed text-[var(--muted)]">
              Your child can call this number from their crisis screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
