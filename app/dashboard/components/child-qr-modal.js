"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { CHILD_PLAY_STORE_URL } from "../../../lib/storeLinks";

export function ChildQrModal({ open, onClose, childName, qrCode }) {
  if (!open || typeof document === "undefined" || !qrCode) return null;
  return <Content childName={childName} qrCode={qrCode} onClose={onClose} />;
}

function Content({ childName, qrCode, onClose }) {
  const [dataUrl, setDataUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage(err.message || "Failed to render QR code");
      });
    return () => {
      cancelled = true;
    };
  }, [qrCode]);

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

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="child-qr-title"
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-[var(--shadow-elevated)]"
      >
        <div className="space-y-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h1
              id="child-qr-title"
              className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
            >
              Link {childName || "Child"}&apos;s Device
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

          {errorMessage ? (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white p-4">
              {dataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={dataUrl}
                  alt={`QR code to link ${childName || "child"}'s device`}
                  width={280}
                  height={280}
                  className="h-[280px] w-[280px]"
                />
              ) : (
                <div className="h-[280px] w-[280px] animate-pulse rounded-lg bg-[var(--surface-muted)]" />
              )}
            </div>
          )}

          <p className="text-center text-[12.5px] text-[var(--muted)]">
            Scan this permanent QR code from the child&apos;s app to link their
            device.
          </p>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="break-all text-center font-mono text-[11.5px] text-[var(--foreground)]">
              {qrCode}
            </p>
          </div>

          {/* Matches GuardParent's QR sheet, which offers the same link. */}
          <a
            href={CHILD_PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2.5 text-[12.5px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--surface-muted)]"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download the child app on Google Play
          </a>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
