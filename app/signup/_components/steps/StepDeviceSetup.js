import { Smartphone } from "lucide-react";
import { ErrorBanner, StepCard, StepFooter } from "../StepShell";

const INSTRUCTIONS = [
  {
    title: "Download the Guardiané companion app",
    desc: 'Available on iOS App Store and Google Play. Search "Guardiané Kids".',
  },
  {
    title: "Link it to your child",
    desc: "On their phone, scan your child's QR code from your dashboard, or type their child code.",
  },
  {
    title: "Grant required permissions",
    desc: "Allow screen time, notifications, and accessibility as prompted. These are required for monitoring.",
  },
  {
    title: "Set up Screen Time together (iPhone)",
    desc: "Your child can see their Screen Time settings but not change them. Get an unlock code from Screen Time on your dashboard, then on their phone open Menu → Screen Time → Parent unlock.",
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

      {/* Apple Family Sharing is the only thing that stops a child removing
          the Screen Time permission or deleting the app. Optional — without it
          the parent is alerted instead (see the kid app's ScreenTimeManager). */}
      <div className="mt-5 rounded-xl bg-[var(--accent-bg)] p-4">
        <p className="text-[0.8rem] font-semibold text-[var(--foreground)]">
          Recommended for iPhone: Apple Family Sharing
        </p>
        <p className="mt-1 text-[0.75rem] leading-[1.6] text-[var(--muted)]">
          Add your child&apos;s Apple ID to your Family Sharing group, then
          choose &quot;Use Family Sharing&quot; when setting up Screen Time.
          Your child then can&apos;t turn it off or delete Guardiané without
          your approval. You can skip this — we&apos;ll alert you if Screen Time
          is turned off instead.
        </p>
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
