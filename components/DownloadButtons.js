"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { APP_STORE_URL, PLAY_STORE_URL } from "../lib/storeLinks";

const STORE_LINKS = {
  app_store: APP_STORE_URL,
  play_store: PLAY_STORE_URL,
};

function formatTermsForDisplay(text) {
  const lines = text.split("\n").map((line) => line.trim());
  const blocks = [];
  let paragraphBuffer = [];
  let inContactSection = false;

  const flushParagraph = () => {
    if (!paragraphBuffer.length) {
      return;
    }
    blocks.push({ type: "paragraph", text: paragraphBuffer.join(" ") });
    paragraphBuffer = [];
  };

  for (const line of lines) {
    if (!line) {
      flushParagraph();
      continue;
    }

    if (line.startsWith("----------------Page")) {
      flushParagraph();
      continue;
    }

    if (/^\d+\./.test(line)) {
      flushParagraph();
      blocks.push({ type: "heading", text: line });
      inContactSection = /^27\.\s*Contact Information/i.test(line);
      continue;
    }

    if (inContactSection) {
      flushParagraph();
      blocks.push({ type: "contact", text: line });
      continue;
    }

    if (/^[•\u2022\-"]\s+/.test(line)) {
      flushParagraph();
      blocks.push({ type: "bullet", text: line.replace(/^[•\u2022\-"]\s+/, "") });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return blocks;
}

export function DownloadButtons({
  className = "flex flex-col gap-3 sm:flex-row",
  buttonClassName = "",
}) {
  const [showTerms, setShowTerms] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [termsText, setTermsText] = useState("Loading Terms of Service...");
  const [canAgree, setCanAgree] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const termsContentRef = useRef(null);
  const formattedTerms = formatTermsForDisplay(termsText);

  useEffect(() => {
    if (!showTerms) {
      return;
    }

    let isMounted = true;

    fetch("/api/terms")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load terms");
        }
        return response.text();
      })
      .then((text) => {
        if (!isMounted) {
          return;
        }
        setTermsText(text);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setTermsText(
          "Terms of Service are currently unavailable. Please try again in a moment."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [showTerms]);

  useEffect(() => {
    if (!showTerms) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showTerms]);

  const openTermsGate = (event, store) => {
    event.preventDefault();
    setSelectedStore(store);
    setShowTerms(true);
    setCanAgree(false);
    setAgreed(false);
    setTermsText("Loading Terms of Service...");
  };

  const handleTermsScroll = () => {
    if (!termsContentRef.current || canAgree) {
      return;
    }

    const { scrollTop, clientHeight, scrollHeight } = termsContentRef.current;
    const reachedBottom = scrollTop + clientHeight >= scrollHeight - 12;

    if (reachedBottom) {
      setCanAgree(true);
    }
  };

  const continueToStore = () => {
    if (!selectedStore || !agreed || !canAgree) {
      return;
    }

    const destination = STORE_LINKS[selectedStore];
    setShowTerms(false);
    window.open(destination, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className={className}>
        <a
          href={APP_STORE_URL}
          onClick={(event) => openTermsGate(event, "app_store")}
          className={`focus-visible-ring brand-btn rounded-full px-7 py-3 text-sm font-medium ${buttonClassName}`}
        >
          App Store
        </a>
        <a
          href={PLAY_STORE_URL}
          onClick={(event) => openTermsGate(event, "play_store")}
          className={`focus-visible-ring outline-btn rounded-full px-7 py-3 text-sm font-medium ${buttonClassName}`}
        >
          Google Play
        </a>
      </div>

      {showTerms &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[1000] h-dvh w-screen bg-[var(--background)]">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="terms-title"
              className="flex h-full w-full flex-col overflow-hidden"
            >
              <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:px-8">
                <div className="mx-auto w-full max-w-5xl">
                  <h2 id="terms-title" className="text-2xl font-semibold text-[var(--foreground)]">
                    Terms of Service
                  </h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    You must read to the end and agree before continuing your download.
                  </p>
                </div>
              </div>

              <div
                ref={termsContentRef}
                onScroll={handleTermsScroll}
                className="flex-1 overflow-y-auto px-5 py-5 text-[15px] leading-7 text-[var(--foreground)] sm:px-8"
              >
                <div className="mx-auto w-full max-w-5xl text-left">
                  {formattedTerms.map((block, index) => {
                    if (block.type === "heading") {
                      return (
                        <h3 key={`terms-${index}`} className="mt-6 text-base font-semibold first:mt-0">
                          {block.text}
                        </h3>
                      );
                    }

                    if (block.type === "bullet") {
                      return (
                        <p key={`terms-${index}`} className="ml-5 list-item list-disc text-[15px]">
                          {block.text}
                        </p>
                      );
                    }

                    if (block.type === "divider") {
                      return (
                        <p
                          key={`terms-${index}`}
                          className="my-5 border-y border-[var(--border)] py-2 text-center text-xs tracking-wide text-[var(--muted)]"
                        >
                          {block.text}
                        </p>
                      );
                    }

                    if (block.type === "contact") {
                      return (
                        <p key={`terms-${index}`} className="mb-1 text-[15px] font-medium text-[var(--foreground)]">
                          {block.text}
                        </p>
                      );
                    }

                    return (
                      <p key={`terms-${index}`} className="mb-3 text-[15px] last:mb-0">
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4 sm:px-8">
                <div className="mx-auto w-full max-w-5xl">
                  <label className="mb-4 flex items-start gap-3 text-sm text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      disabled={!canAgree}
                      checked={agreed}
                      onChange={(event) => setAgreed(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--border)]"
                    />
                    <span>
                      I have read and agree to the Terms of Service.
                      {!canAgree && (
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                          Scroll to the bottom to enable agreement.
                        </span>
                      )}
                    </span>
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setShowTerms(false)}
                      className="outline-btn rounded-full px-5 py-2.5 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!canAgree || !agreed}
                      onClick={continueToStore}
                      className="brand-btn rounded-full px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Agree and Continue
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>,
          document.body
        )}
    </>
  );
}
