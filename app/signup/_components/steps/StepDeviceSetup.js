import { Smartphone } from "lucide-react";
import { ErrorBanner, StepCard, StepFooter } from "../StepShell";

const INSTRUCTIONS = [
  {
    title: "Download the Guardiané companion app",
    desc: 'Available on iOS App Store and Google Play. Search "Guardiané Child".',
  },
  {
    title: "Sign in with your parent account",
    desc: "Use the same email and password you just created.",
  },
  {
    title: "Select the child's profile",
    desc: "Choose which profile to link to this device. You can connect multiple devices per child.",
  },
  {
    title: "Grant required permissions",
    desc: "Allow screen time, notifications, and accessibility as prompted. These are required for monitoring.",
  },
];

export function StepDeviceSetup({ onFinish, onBack, submitting, error }) {
  return (
    <StepCard
      title="Connect your child's device"
      sub="Follow these steps to link the device"
    >
      <ErrorBanner msg={error} />

      <div className="divide-y divide-[var(--border)]">
        {INSTRUCTIONS.map((s, i) => (
          <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] font-sans text-[0.72rem] font-semibold text-[var(--accent)]">
              {i + 1}
            </div>
            <div>
              <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">
                {s.title}
              </p>
              <p className="mt-0.5 text-[0.75rem] leading-[1.6] text-[var(--muted)]">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onFinish}
        nextLabel={submitting ? "Creating account…" : "Finish setup →"}
        nextDisabled={submitting}
      />
    </StepCard>
  );
}
