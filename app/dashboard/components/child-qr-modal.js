"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import {
  CHILD_PLAY_STORE_MARKET_URL,
  CHILD_PLAY_STORE_URL,
  CHILD_APP_STORE_URL,
} from "../../../lib/storeLinks";
import { PlayStoreLink } from "../../../components/play-store-link";

const FORMATS = { QR: "qr", BARCODE: "barcode" };

export function ChildQrModal({ open, onClose, childName, qrCode }) {
  if (!open || typeof document === "undefined" || !qrCode) return null;
  return <Content childName={childName} qrCode={qrCode} onClose={onClose} />;
}

function Content({ childName, qrCode, onClose }) {
  const [format, setFormat] = useState(FORMATS.QR);
  const [dataUrl, setDataUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (format !== FORMATS.QR) return;
    let cancelled = false;
    QRCode.toDataURL(qrCode, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 320,
      color: { dark: "#000000", light: "#FFFFFF" },
    })
      .then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        setErrorMessage(null);
      })
      .catch((err) => {
        if (!cancelled) setErrorMessage(err.message || "Failed to render QR code");
      });
    return () => {
      cancelled = true;
    };
  }, [qrCode, format]);

  // Code128 encodes the same doc-id payload as a 1D barcode — a visual
  // alternative to the QR code (e.g. for a physical barcode scanner), not a
  // second pairing method the child app understands. Rendered straight to the
  // ref'd <svg> rather than through state: JsBarcode draws imperatively.
  useEffect(() => {
    if (format !== FORMATS.BARCODE || !barcodeRef.current) return;
    try {
      JsBarcode(barcodeRef.current, qrCode, {
        format: "CODE128",
        width: 2,
        height: 90,
        margin: 12,
        displayValue: false,
        background: "#FFFFFF",
        lineColor: "#000000",
      });
      setErrorMessage(null);
    } catch (err) {
      // Deferred rather than a direct setState in the effect body: JsBarcode
      // throws synchronously, and the error state should only flip once
      // rendering has actually failed, not as an eager reset on every run.
      queueMicrotask(() => setErrorMessage(err.message || "Failed to render barcode"));
    }
  }, [qrCode, format]);

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

          <div className="flex justify-center gap-1 rounded-xl bg-[var(--surface-muted)] p-1">
            <button
              type="button"
              onClick={() => setFormat(FORMATS.QR)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                format === FORMATS.QR
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              QR Code
            </button>
            <button
              type="button"
              onClick={() => setFormat(FORMATS.BARCODE)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                format === FORMATS.BARCODE
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Barcode
            </button>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-3 text-[12.5px] text-[var(--danger)]">
              {errorMessage}
            </div>
          ) : format === FORMATS.QR ? (
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
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white p-4">
              <svg
                ref={barcodeRef}
                role="img"
                aria-label={`Barcode to link ${childName || "child"}'s device`}
                className="h-[120px] w-full max-w-[320px]"
              />
            </div>
          )}

          <p className="text-center text-[12.5px] text-[var(--muted)]">
            {format === FORMATS.QR
              ? "Scan this permanent QR code from the child’s app to link their device."
              : "This barcode encodes the same pairing code as the QR code above — use it if you’re scanning with a physical barcode reader instead of the child app’s camera."}
          </p>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="break-all text-center font-mono text-[11.5px] text-[var(--foreground)]">
              {qrCode}
            </p>
          </div>

          {/* Matches GuardParent's QR sheet, which offers the same link, plus
              an iOS storefront link since parents ask for both platforms. */}
          <div className="grid grid-cols-2 gap-2">
            <PlayStoreLink
              href={CHILD_PLAY_STORE_URL}
              marketHref={CHILD_PLAY_STORE_MARKET_URL}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Google Play
            </PlayStoreLink>
            <a
              href={CHILD_APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] px-3 py-2.5 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--surface-muted)]"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M17.5 2.5c.3 1.3-.2 2.6-1 3.5-.8.9-2.1 1.6-3.3 1.5-.2-1.2.3-2.5 1.1-3.4.8-.9 2.2-1.6 3.2-1.6zM20.9 17c-.5 1.2-.8 1.7-1.5 2.7-1 1.5-2.3 3.3-4 3.3-1.5 0-1.9-1-3.9-1s-2.5 1-4 1c-1.7 0-3-1.6-3.9-3.1-2.7-4.2-3-9.1-1.3-11.7 1.2-1.8 3-2.9 4.8-2.9 1.8 0 3 1 4.5 1 1.5 0 2.4-1 4.5-1 1.6 0 3.3.9 4.5 2.4-4 2.2-3.3 7.9.3 9.3z" />
              </svg>
              App Store
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
