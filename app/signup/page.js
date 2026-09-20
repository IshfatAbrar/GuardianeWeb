"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteFooter } from "../../components/site-footer";
import { AuthGuard } from "../../components/auth-guard";
import { HeroHalfBox } from "../../components/hero-half-box";
import { Accordion } from "../../components/accordion";
import { signUp } from "../lib/authHelper";
import { Stepper } from "./_components/Stepper";
import { StepAccount } from "./_components/steps/StepAccount";
import { StepAddChild } from "./_components/steps/StepAddChild";
import { StepManageChildren } from "./_components/steps/StepManageChildren";
import { StepDeviceSetup } from "./_components/steps/StepDeviceSetup";
import { StepDone } from "./_components/steps/StepDone";

const whyGuardianeFaqs = [
  {
    title: "Set up in 2 minutes",
    content: <p>Guided onboarding gets your first child profile live fast.</p>,
  },
  {
    title: "Instant alerts",
    content: <p>Push notifications for high-risk signals, day or night.</p>,
  },
  {
    title: "Privacy by design",
    content: <p>Your data is never sold. COPPA and GDPR compliant.</p>,
  },
  {
    title: "Expert support",
    content: <p>Access vetted counselors and child safety specialists.</p>,
  },
];

export default function SignupPage() {
  const [step, setStep] = useState(0); // 0–3, then 'done'
  const [account, setAccount] = useState(null); // { fullName, email, phone, password, agreed }
  const [children, setChildren] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [verifyEmail, setVerifyEmail] = useState(null); // set when they must verify before signing in

  const addChild = (child) => setChildren((prev) => [...prev, child]);
  const removeChild = (i) =>
    setChildren((prev) => prev.filter((_, idx) => idx !== i));

  const handleFinish = async () => {
    if (!account) {
      setSubmitError("Account details are missing. Please go back to step 1.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const trimmedName = account.fullName.trim();
      const result = await signUp(
        account.email,
        account.password,
        trimmedName,
        {
          children,
          phone: account.phone,
        },
      );
      setVerifyEmail(result.needsVerification ? account.email : null);
      setStep("done");
    } catch (e) {
      const code = e?.code ?? "";
      if (code === "auth/email-already-in-use")
        setSubmitError(
          "An account with this email already exists. Try logging in.",
        );
      else if (code === "auth/invalid-email")
        setSubmitError("Please enter a valid email address.");
      else if (code === "auth/weak-password")
        setSubmitError("Password is too weak.");
      else if (code === "permission-denied")
        setSubmitError(
          "Firestore rules rejected the write. Check the browser console for the failing operation.",
        );
      else setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepAccount
            initial={account}
            onNext={(data) => {
              setAccount(data);
              setStep(1);
            }}
          />
        );
      case 1:
        return (
          <StepAddChild
            onNext={(child) => {
              addChild(child);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        );
      case 2:
        return (
          <StepManageChildren
            childList={children}
            onAdd={addChild}
            onRemove={removeChild}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <StepDeviceSetup
            onFinish={handleFinish}
            onBack={() => setStep(2)}
            submitting={submitting}
            error={submitError}
          />
        );
      case "done":
        return <StepDone verifyEmail={verifyEmail} />;
    }
  };

  return (
    <AuthGuard mode="public">
      {/* TEMP: forced white background for now */}
      <div className="bg-white text-[var(--foreground)]">
        {/* ── HERO / SIGNUP ── */}
        <section className="bg-white">
          <HeroHalfBox>
            <div className="mx-auto max-w-[960px]  py-14 lg:py-20">
              <div className="mb-10 text-center" data-reveal>
                <h1 className="font-serif text-3xl font-normal tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.75rem]">
                  Create your Guardiané account
                </h1>
                <p className="mt-3 text-[0.85rem] text-[var(--muted)]">
                  Set up your parent portal in minutes
                </p>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)]">
                {step !== "done" && <Stepper current={step} />}
                <div className=" py-8 sm:px-10">{renderStep()}</div>
              </div>

              {step !== "done" && (
                <p className="mt-6 text-center text-[0.78rem] text-[var(--muted)]">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              )}
            </div>
          </HeroHalfBox>
        </section>

        {/* ── WHY GUARDIANE ── */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-[1120px] px-6 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div data-reveal>
                <h2 className="gradient-heading mb-6 text-2xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-3xl">
                  Why families choose Guardiané
                </h2>
                <p className="clarity-prose text-[0.8rem]">
                  Built by child safety researchers, psychologists, and parents
                  — not just engineers.
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
              <div data-reveal>
                <Accordion items={whyGuardianeFaqs} />
              </div>
            </div>
          </div>
        </section>

        <SiteFooter tagline="Protecting children's digital safety and mental wellbeing through responsible AI innovation." />
      </div>
    </AuthGuard>
  );
}
