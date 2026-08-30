"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { AuthGuard } from "../../components/auth-guard";
import { Accordion } from "../../components/accordion";
import { signIn } from "../lib/authHelper"; // ← Firebase helper
import { PasswordInput } from "../../components/password-input";

const whatYouGetFaqs = [
  {
    title: "Live risk detection",
    content: (
      <p>
        AI flags concerning digital activity patterns in real time before they
        escalate.
      </p>
    ),
  },
  {
    title: "Mood & wellbeing",
    content: (
      <p>
        Daily mood logs and streak analytics give you an emotional pulse on each
        child.
      </p>
    ),
  },
  {
    title: "Learning progress",
    content: (
      <p>Track completion of assigned digital safety and resilience modules.</p>
    ),
  },
  {
    title: "Counselor connect",
    content: (
      <p>
        Seamless access to vetted mental health professionals when your family
        needs support.
      </p>
    ),
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");

    // Basic client-side guard
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err) {
      // Map Firebase error codes to friendly messages
      const code = err?.code ?? "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else if (code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <AuthGuard mode="public">
      {/* TEMP: forced white background for now */}
      <div className="bg-white text-[var(--foreground)]">
        {/* ── HERO / LOGIN ── */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1120px] gap-16 px-10 py-10 mt-6 mb-12 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8 rounded-xl bg-gradient-to-t from-[#c2dfff] to-white to-70%">
            {/* LEFT: Copy */}
            <div className="clarity-copy mt-10" data-reveal>
              <h1 className="mb-5 max-w-3xl bg-[var(--foreground)] bg-clip-text text-3xl font-normal leading-[1.06] tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                Your family&apos;s
                <br />
                safety dashboard
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--foreground)]">
                Monitor your children&apos;s digital wellbeing, track emotional
                health signals, and connect with trusted counselors — all in one
                place.
              </p>

              <p className="clarity-prose mt-6 max-w-2xl text-[0.85rem] leading-[1.85]">
                Guardiané&apos;s parent portal brings together real-time risk
                detection, learning progress, mood analytics, and screen-time
                insights so every family has the visibility they need to stay
                safe and supported.
              </p>
            </div>

            {/* RIGHT: Login Card */}
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-10 py-11 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                  Parent portal
                </p>
                <h2 className="mb-1.5 font-serif text-[1.7rem] font-normal leading-[1.1] tracking-tight">
                  Sign in
                </h2>
                <p className="text-[0.76rem] text-[var(--muted)]">
                  Welcome back — access your dashboard
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.72rem] text-red-700">
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="mb-5">
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

              {/* Password */}
              <div className="mb-2">
                <label className="mb-2 block text-[0.62rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Password
                </label>
                <PasswordInput
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-[0.82rem] text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>

              {/* Forgot password */}
              <div className="mb-6 flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[0.7rem] text-[var(--accent)] no-underline hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full rounded bg-[var(--accent)] px-3 py-3.5 font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Signing in…" : "Sign in →"}
                </button>
              </div>

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

        {/* ── FEATURES ── */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1120px] px-6 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div data-reveal>
                <Accordion items={whatYouGetFaqs} />
              </div>
              <div data-reveal>
                <h2 className="gradient-heading mb-6 font-normal leading-[1.08] tracking-[-0.04em] text-3xl">
                  What you get access to
                </h2>
                <p className="clarity-prose text-[0.8rem]">
                  Everything a parent needs to protect, support, and empower
                  their children online.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    "Busy parents",
                    "School nights",
                    "Blended homes",
                    "Teen years",
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
