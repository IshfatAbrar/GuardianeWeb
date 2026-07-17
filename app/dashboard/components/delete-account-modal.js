"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { deleteUser } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { deleteAccountData } from "../../lib/database";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountModal({ open, onClose, onDeleted, uid, childList }) {
  if (!open || typeof document === "undefined") return null;
  return (
    <Content
      onClose={onClose}
      onDeleted={onDeleted}
      uid={uid}
      childList={childList}
    />
  );
}

function Content({ onClose, onDeleted, uid, childList }) {
  const [confirmText, setConfirmText] = useState("");
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

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_PHRASE && !submitting;

  async function handleDelete() {
    if (!canDelete) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      if (!auth.currentUser) throw new Error("Not signed in");
      // Tear down Firestore data while still authenticated (rules require it),
      // then remove the auth user. deleteAccountData is idempotent — a missing
      // doc is not an error — so a retry after re-login is safe.
      await deleteAccountData({ uid, children: childList });
      await deleteUser(auth.currentUser);
      onDeleted?.();
    } catch (err) {
      if (err?.code === "auth/requires-recent-login") {
        setErrorMessage(
          "For security, please sign out and sign back in, then try deleting again.",
        );
      } else {
        setErrorMessage(err.message || "Failed to delete account");
      }
      setSubmitting(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/15">
              <svg width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              </svg>
            </div>
            <h1 id="delete-account-title" className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
              Delete account?
            </h1>
          </div>

          <p className="text-[13px] leading-relaxed text-[var(--muted)]">
            This permanently deletes your sign-in and deactivates your family:
            your children&apos;s profiles are turned off and your family record
            is removed. This cannot be undone.
          </p>

          {errorMessage && (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Type <span className="font-mono text-rose-500">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-[14px] text-[var(--foreground)] focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete}
              className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
