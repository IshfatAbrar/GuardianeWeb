"use client";

import { useState } from "react";

import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { AuthGuard } from "../../components/auth-guard";
import { Accordion } from "../../components/accordion";
import { resetPassword } from "../lib/authHelper"; // ← Firebase sendPasswordResetEmail
import { MailCheck } from "lucide-react";

const stayingSecureFaqs = [
  {
    title: "Verified by email",
    content: (
      <p>
        Reset links are sent only to the address on file, so no one else can
        request changes to your account.
      </p>
    ),
  },
  {
    title: "Time-limited link",
    content: (
      <p>
        Every reset link expires automatically after a short window to limit
        exposure.
      </p>
    ),
  },
  {
    title: "Single-use only",
    content: (
      <p>
        Each link works exactly once, then becomes invalid — even if it is
        forwarded.
      </p>
    ),
  },
  {
    title: "Encrypted in transit",
    content: (
      <p>
        All requests travel over 256-bit encrypted connections from start to
        finish.
      </p>
    ),
  },
];

/**
 * Ask the server to send our branded reset email. Resolves `true` when it did,
 * `false` when this deployment isn't set up to (or the request failed) and the
 * caller should use Firebase's built-in email instead. Rejects only for an
 * address the server says is invalid.
 */
async function requestBrandedReset(email) {
  let res;
  try {
    res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    return false; // offline / route unreachable — fall back
  }
  if (res.status === 400) {
    throw Object.assign(new Error("invalid-email"), {
      code: "auth/invalid-email",
    });
  }
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  return data?.delivery === "sent";
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setError("");

    // Basic client-side guard
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      // Branded email when the server is configured for it; otherwise Firebase
      // Auth (same backend as iOS/login) sends its built-in reset email.
      const sentBranded = await requestBrandedReset(email.trim());
      if (!sentBranded) await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      // Map Firebase error codes to friendly messages
      const code = err?.code ?? "";
      if (code === "auth/user-not-found") {
        // Don't reveal whether an account exists — show the same success state.
        setSent(true);
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <AuthGuard mode="public">
      {/* TEMP: forced white background for now */}
      <div className="bg-white text-[var(--foreground)]">
        {/* ── HERO / RESET ── */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1120px] gap-16 px-10 py-10 mt-6 mb-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8 rounded-xl bg-gradient-to-t from-[#c2dfff] to-white to-70%">
            {/* LEFT: Copy */}
            <div className="clarity-copy mt-10" data-reveal>
              <h1 className="mb-5 max-w-3xl bg-[var(--foreground)] bg-clip-text text-3xl font-normal leading-[1.06] tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                Forgot your
                <br />
                password?
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--foreground)]">
                It happens. Enter the email linked to your account and
                we&apos;ll send you a secure link to set a new password.
              </p>

              <p className="clarity-prose mt-6 max-w-2xl text-[0.85rem] leading-[1.85]">
                For your family&apos;s security, the reset link expires after a
                short time and can only be used once. If you don&apos;t see the
                email, check your spam folder or reach out to our support team.
              </p>
            </div>

            {/* RIGHT: Reset Card */}
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-10 py-11 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Parent portal
                </p>
                <h2 className="mb-1.5 font-serif text-[1.7rem] font-normal leading-[1.1] tracking-tight">
                  Reset password
                </h2>
                <p className="text-[0.76rem] text-[var(--muted)]">
                  {sent
                    ? "Check your inbox for the next step"
                    : "We’ll email you a link to reset it"}
                </p>
              </div>

              {sent ? (
                <>
                  {/* Success state */}
                  <div className="mb-6 flex flex-col items-center gap-4 rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-6 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10">
                      <MailCheck
                        className="h-6 w-6 text-[var(--accent)]"
                        strokeWidth={1.8}
                      />
                    </span>
                    <div>
                      <p className="mb-1 text-[0.85rem] font-semibold text-[var(--foreground)]">
                        Check your email
                      </p>
                      <p className="text-[0.72rem] leading-relaxed text-[var(--muted)]">
                        If an account exists for{" "}
                        <span className="font-medium text-[var(--foreground)]">
                          {email}
                        </span>
                        , you&apos;ll receive a password reset link shortly.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setSent(false)}
                      className="w-full rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-3 text-center font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--accent)] transition-all hover:bg-[var(--accent-bg-hover)]"
                    >
                      Use a different email
                    </button>
                    <Link
                      href="/login"
                      className="w-full rounded bg-[var(--accent)] px-3 py-3.5 text-center font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 no-underline"
                    >
                      Back to sign in →
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* Error banner */}
                  {error && (
                    <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.72rem] text-red-700">
                      {error}
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-6">
                    <label className="mb-2 block text-[0.62rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-[0.82rem] text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full rounded bg-[var(--accent)] px-3 py-3.5 font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? "Sending link…" : "Send reset link →"}
                    </button>

                    <div className="flex items-center gap-3 text-[0.7rem] text-[var(--muted)]">
                      <div className="h-px flex-1 bg-[var(--border)]" />
                      or
                      <div className="h-px flex-1 bg-[var(--border)]" />
                    </div>

                    <Link
                      href="/login"
                      className="w-full rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-3 text-center font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-[var(--accent)] transition-all hover:bg-[var(--accent-bg-hover)] no-underline"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className=" pt-4 text-center text-[0.65rem] leading-relaxed text-[var(--muted)]">
                Protected by 256-bit encryption&nbsp;·&nbsp;
                <Link
                  href="#"
                  className="text-[var(--accent)] no-underline hover:underline"
                >
                  Privacy Policy
                </Link>
                &nbsp;·&nbsp;
                <Link
                  href="#"
                  className="text-[var(--accent)] no-underline hover:underline"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── REASSURANCE ── */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1120px] px-6 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div data-reveal>
                <Accordion items={stayingSecureFaqs} />
              </div>
              <div data-reveal>
                <h2 className="gradient-heading mb-6 font-normal leading-[1.08] tracking-[-0.04em] text-3xl">
                  Your account stays secure
                </h2>
                <p className="clarity-prose text-[0.8rem]">
                  Resetting your password never exposes your family&apos;s data.
                  Here&apos;s how we keep it safe.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    "Email-verified",
                    "Expires in 1 hour",
                    "Single use",
                    "Encrypted",
                  ].map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[0.78rem] font-medium text-[var(--muted)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SiteFooter tagline="Protecting children's digital safety and mental wellbeing through responsible AI innovation." />
      </div>
    </AuthGuard>
  );
}
