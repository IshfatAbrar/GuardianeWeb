import { JojoAvatar } from "./jojo-avatar";
import {
  Bell,
  BookOpen,
  Brain,
  HeartHandshake,
  Home as HomeIcon,
  MessageCircle,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

const tiles = [
  {
    title: "Intelligent Monitoring",
    desc: "Real-time detection of digital safety and emotional risk signals",
    icon: Brain,
  },
  {
    title: "Dynamic Education",
    desc: "Developmentally appropriate content for children and teens",
    icon: BookOpen,
  },
  {
    title: "Parental Guidance",
    desc: "Personalized, practical tools tailored to every family",
    icon: Users,
  },
  {
    title: "Counselor Networks",
    desc: "Seamless access to vetted mental health professionals",
    icon: HeartHandshake,
  },
];

export function JojoPreviewCard() {
  return (
    <div className="relative mx-auto max-w-8xl">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]">
        <div className="flex">
          {/* icon rail */}
          <div className="hidden w-16 flex-shrink-0 flex-col items-center gap-5 border-r border-[var(--border)] bg-[var(--surface-muted)] py-8 sm:flex">
            {[HomeIcon, MessageCircle, Bell, ShieldCheck, Settings].map(
              (Icon, i) => (
                <span
                  key={i}
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-lg " +
                    (i === 0
                      ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                      : "text-[var(--muted)]")
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                </span>
              ),
            )}
          </div>

          {/* main panel */}
          <div className="min-w-0 flex-1 p-8 sm:p-10">
            <div className="flex items-center gap-3.5">
              <JojoAvatar size={72} className="flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-base font-semibold text-[var(--foreground)]">
                  Hi, I&apos;m JoJo
                </p>
                <p className="truncate text-sm text-[var(--muted)]">
                  How can I help your family today?
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {tiles.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                      <Icon size={18} strokeWidth={2} />
                    </span>
                    <p className="mt-3 text-[0.9rem] font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[0.78rem] leading-relaxed text-[var(--muted)]">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-3">
              <MessageCircle
                size={15}
                className="flex-shrink-0 text-[var(--muted)]"
                strokeWidth={2}
              />
              <span className="truncate text-[0.82rem] text-[var(--muted)]">
                Ask JoJo anything…
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
