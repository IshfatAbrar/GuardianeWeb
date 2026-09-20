import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function StepDone({ verifyEmail = null }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
      </div>
      <h2 className="mb-2 font-serif text-[1.9rem] font-normal tracking-tight text-[var(--foreground)]">
        {verifyEmail ? "Verify your email" : "You're all set!"}
      </h2>
      <p className="mb-8 max-w-xs text-[0.85rem] leading-relaxed text-[var(--muted)]">
        {verifyEmail ? (
          <>
            We sent a verification link to{" "}
            <span className="font-medium text-[var(--foreground)]">
              {verifyEmail}
            </span>
            . Click it, then sign in to reach your dashboard.
          </>
        ) : (
          "Your Guardiané parent portal is ready. Head to your dashboard to start protecting your family."
        )}
      </p>
      <button
        onClick={() => router.push(verifyEmail ? "/login" : "/dashboard")}
        className="rounded bg-[var(--accent)] px-7 py-3.5 font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)] active:translate-y-0.5"
      >
        {verifyEmail ? "Go to sign in →" : "Go to dashboard →"}
      </button>
    </div>
  );
}
