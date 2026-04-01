import Link from "next/link";
import { ThemeToggle } from "../components/theme-toggle";

import { DownloadButtons } from "../components/DownloadButtons";

const features = [
  {
    title: "Mood boards & emotional arc",
    body: "See how they’re doing at a glance—mood levels, history, and charts that help you spot patterns before they become problems.",
  },
  {
    title: "Screen-time intelligence",
    body: "Know where hours go: top apps, balance over the week, and reporting windows that match how your family actually lives.",
  },
  {
    title: "Learning progress",
    body: "Modules, lessons, assignments, and streaks in one hub—so growth shows up as progress you can see and celebrate.",
  },
  {
    title: "Family messaging",
    body: "Stay in the same conversation as your kid—fast, clear parent–child threads when schedules won’t wait.",
  },
  {
    title: "Threat-aware texting",
    body: "Smart signals when messages look off, urgent, or risky—step in early instead of finding out late.",
  },
  {
    title: "Alerts that demand attention",
    body: "What matters rises to the top—so you’re not drowning in noise when something actually needs a parent.",
  },
  {
    title: "Emergency contacts & map",
    body: "Contacts and location context in reach when safety isn’t theoretical—it’s right now.",
  },
  {
    title: "Built for every kid in the house",
    body: "Switch child profiles in seconds—each one gets a clear dashboard, tailored to their world.",
  },
];

const statBlocks = [
  { k: "Mood", v: "boards & emotional trends" },
  { k: "Time", v: "screen intelligence" },
  { k: "Learn", v: "progress & lessons" },
  { k: "Safe", v: "text alerts & signals" },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 glass">
        <nav className="mx-auto flex h-[52px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="focus-visible-ring text-sm font-semibold tracking-tight"
          >
            Guardiané
          </Link>
          <ul className="hidden items-center gap-7 text-xs lg:flex">
            <li>
              <Link
                href="#features"
                className="focus-visible-ring font-medium text-[var(--foreground)] transition-colors"
              >
                Product
              </Link>
            </li>
            <li>
              <Link
                href="#overview"
                className="focus-visible-ring text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                href="#families"
                className="focus-visible-ring text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Families
              </Link>
            </li>
            <li>
              <Link
                href="#download"
                className="focus-visible-ring text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Download
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="#download"
              className="focus-visible-ring brand-btn rounded-full px-4 py-1.5 text-xs font-medium"
            >
              Get the app
            </Link>
          </div>
        </nav>
      </header>

      <main className="min-h-screen overflow-x-clip overflow-y-visible text-[var(--foreground)]">
        <section className="relative flex min-h-svh flex-col items-center justify-center px-4 pb-28 pt-32 text-center sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, color-mix(in oklab, var(--foreground) 10%, transparent), transparent)",
            }}
          />
          <div
            data-reveal
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--muted)]">
              Clarity for parents. Calm for families.
            </span>
            <h1 className="gradient-heading max-w-4xl text-5xl font-bold leading-[1.1] tracking-tighter sm:text-6xl lg:text-7xl lg:leading-[1.08] xl:text-[80px] xl:leading-[1.06]">
              Know their world
              <br className="hidden sm:block" /> before the noise wins
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
              Guardiané turns scattered signals into a single story:{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                mood boards
              </strong>
              ,{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                screen-time intelligence
              </strong>
              ,{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                learning progress
              </strong>
              , and{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                family messaging
              </strong>{" "}
              with smart alerts—including{" "}
              <strong className="font-semibold text-[var(--foreground)]">
                threat-aware texting
              </strong>{" "}
              when something needs you now, not later.
            </p>
            <DownloadButtons className="flex flex-col gap-3 sm:flex-row" />
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
                Mood boards
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
                Screen-time monitoring
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
                Learning progress
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
                Threat-aware texting
              </span>
            </div>
          </div>

          <div
            data-reveal
            id="overview"
            className="product-glow relative z-10 mt-16 w-full max-w-xl scroll-mt-24"
          >
            <div className="relative z-10 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] elevated-shadow">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-muted)]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 11.5V6a2 2 0 0 1 2-2h5M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 22V12h6v10M9 12H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-medium">Parent dashboard</p>
                    <p className="text-xs text-[var(--muted)]">
                      Child profile selected
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[var(--color-emerald-500)]"
                    aria-hidden
                  />
                  Live
                </span>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--surface-muted)] px-4 py-3 text-left">
                  Flag anything odd in last night’s thread?
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-left text-[var(--muted)]">
                  Yes—threat-aware texting surfaced two phrases for review. Mood
                  board is steady; screen time dipped after school. Open{" "}
                  <Link
                    href="#features"
                    className="text-[var(--foreground)] underline underline-offset-2"
                  >
                    Reports
                  </Link>{" "}
                  for the full arc.
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <button
                  type="button"
                  aria-label="Primary action"
                  className="focus-visible-ring mic-pulse inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] transition-opacity hover:opacity-80"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 3.5a3 3 0 0 0-3 3v5a3 3 0 1 0 6 0v-5a3 3 0 0 0-3-3Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M5 11.5a7 7 0 0 0 14 0M12 18.5V21m-3 0h6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <p className="text-xs text-[var(--muted)]">
                  Drawer: switch kids, mood boards, and learning progress—one tap
                  away.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)]" id="families">
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p
              data-reveal
              className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]"
            >
              When staying close means staying informed
            </p>
            <div
              data-reveal
              className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] sm:grid-cols-4"
            >
              {["Busy parents", "School nights", "Blended homes", "Teen years"].map((label) => (
                <div
                  key={label}
                  className="bg-[var(--surface)] px-6 py-5 text-center text-sm font-medium text-[var(--muted)]"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              data-reveal
              className="mt-8 grid gap-4 sm:grid-cols-2"
            >
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-sm text-[var(--muted)]">
                <p>
                  <strong className="text-[var(--foreground)]">
                    Every child, one clear view.
                  </strong>{" "}
                  Swap profiles in seconds—mood boards, screen time, and learning
                  follow the kid you’re focused on.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-sm text-[var(--muted)]">
                <p>
                  <strong className="text-[var(--foreground)]">
                    One story, not scattered tabs.
                  </strong>{" "}
                  Messages, alerts, and trends surface together so you connect
                  dots instead of chasing them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div data-reveal className="mb-16 text-center">
            <h2 className="gradient-heading text-4xl font-bold leading-[1.12] tracking-tighter sm:text-5xl lg:text-6xl">
              What you actually get
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[var(--border)] lg:grid-cols-4">
            {statBlocks.map((row, i) => (
              <div
                key={row.k}
                data-reveal
                className="flex flex-col items-center gap-1 bg-[var(--surface)] px-6 py-10 text-center"
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span className="text-4xl font-bold tracking-tighter lg:text-5xl">
                  {row.k}
                </span>
                <span className="text-sm text-[var(--muted)]">{row.v}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-[var(--border)]" id="features">
          <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
            <div data-reveal className="mb-16 max-w-2xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Features
              </p>
              <h2 className="gradient-heading text-4xl font-bold leading-[1.12] tracking-tighter sm:text-5xl">
                Everything you need to lead with confidence.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  data-reveal
                  className="group bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--surface-muted)]"
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <h3 className="mb-2 text-base font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
            <div data-reveal className="flex max-w-3xl flex-col items-center gap-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Ready when you are
              </p>
              <h2 className="gradient-heading mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tighter sm:text-5xl lg:text-6xl">
                Stop guessing.
                <br className="hidden sm:block" /> Start knowing.
              </h2>
              <p className="mx-auto max-w-xl text-lg text-[var(--muted)]">
                Download Guardiané and put mood, screen time, learning, and
                safer messaging in one decisive dashboard—built for parents who
                don&apos;t have time for guesswork.
              </p>
              <div
                id="download"
                className="flex flex-col items-center justify-center gap-3 pt-2 scroll-mt-28 sm:flex-row"
              >
                <DownloadButtons className="flex flex-col items-center justify-center gap-3 sm:flex-row" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Link href="/" className="text-base font-semibold">
              Guardiané
            </Link>
            <p className="mt-2 max-w-md text-sm text-[var(--muted)]">
              The parent app for mood boards, screen-time clarity, learning
              progress, family messaging, and threat-aware texting—so you see
              what matters and act while it still counts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
            <div className="space-y-2">
              <Link
                href="#features"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Product
              </Link>
              <Link
                href="#download"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Download
              </Link>
              <Link
                href="#overview"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Overview
              </Link>
            </div>
            <div className="space-y-2">
              <Link
                href="#families"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Families
              </Link>
              <Link
                href="#features"
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Features
              </Link>
            </div>
            <div className="space-y-2">
              <span className="block text-[var(--muted)]">Privacy</span>
              <span className="block text-[var(--muted)]">Terms</span>
            </div>
            <div className="space-y-2">
              <span className="block text-[var(--muted)]">Contact</span>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Guardiané. All rights reserved.
        </div>
      </footer>
    </>
  );
}
