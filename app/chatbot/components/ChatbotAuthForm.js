"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useJojoAuth } from "../lib/jojoAuth";

// The simple JoJo contact form, shared by /chatbot/login, /chatbot/signup and
// the in-chat sign-up popup. Either email or phone is required.
//
// Login is a single step. Signup is two steps: (1) email or phone, then
// (2) optional name / child info / zip. On success it either calls `onSuccess`
// (popup — stay on the page) or routes back to /chatbot.

function Field({ label, optional, ...props }) {
  return (
    <label className="block text-left">
      <span className="mb-1 block text-[12px] font-medium text-[var(--muted)]">
        {label}
        {optional && (
          <span className="ml-1 font-normal opacity-70">(optional)</span>
        )}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[14px] text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-bg)]"
      />
    </label>
  );
}

export function ChatbotAuthForm({ mode = "signup", onSuccess }) {
  const router = useRouter();
  const { signUp, logIn } = useJojoAuth();
  const isSignup = mode === "signup";

  const [form, setForm] = useState({
    email: "",
    phone: "",
    name: "",
    childInfo: "",
    zip: "",
  });
  const [step, setStep] = useState(1); // signup only: 1 = contact, 2 = optional info
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const hasContact = form.email.trim() || form.phone.trim();

  async function finalize() {
    setSubmitting(true);
    try {
      const user = isSignup ? await signUp(form) : await logIn(form);
      if (onSuccess) onSuccess(user);
      else router.push("/chatbot");
    } catch (err) {
      setError(
        typeof err?.message === "string" && err.message.length < 120
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError("");
    if (!hasContact) {
      setError("Please enter an email address or phone number.");
      return;
    }
    // Signup step 1 just advances to the optional-info step.
    if (isSignup && step === 1) {
      setStep(2);
      return;
    }
    finalize();
  }

  const contactStep = !isSignup || step === 1;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {isSignup && (
        <p className="text-center text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
          Step {step} of 2
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {contactStep ? (
        <>
          <Field
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
          />

          <div className="flex items-center gap-3 text-[12px] text-[var(--muted)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            or
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <Field
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={form.phone}
            onChange={set("phone")}
          />
        </>
      ) : (
        <>
          <p className="text-center text-[12.5px] leading-relaxed text-[var(--muted)]">
            A few optional details help us tailor JoJo — skip any you like.
          </p>
          <Field
            label="Name"
            optional
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={set("name")}
          />
          <Field
            label="Child info"
            optional
            placeholder="e.g. daughter, age 13"
            value={form.childInfo}
            onChange={set("childInfo")}
          />
          <Field
            label="Zip code"
            optional
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="94102"
            value={form.zip}
            onChange={set("zip")}
          />
        </>
      )}

      <button
        type="submit"
        disabled={submitting || (contactStep && !hasContact)}
        className="mt-1 w-full rounded-full bg-[var(--accent)] px-5 py-2.5 text-[0.76rem] font-semibold uppercase tracking-widest text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting
          ? "Please wait…"
          : isSignup
            ? step === 1
              ? "Continue"
              : "Sign Up"
            : "Sign In"}
      </button>

      {isSignup && step === 2 && (
        <button
          type="button"
          onClick={() => {
            setError("");
            setStep(1);
          }}
          className="text-center text-[12px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          ← Back
        </button>
      )}
    </form>
  );
}
