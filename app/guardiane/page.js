import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple, faGooglePlay } from "@fortawesome/free-brands-svg-icons";
import {
  Smile,
  Smartphone,
  BookOpen,
  MessageCircle,
  ShieldAlert,
  Bell,
  MapPin,
  Users,
} from "lucide-react";
import { APP_STORE_URL } from "../../lib/storeLinks";
import { PlayStoreLink } from "../../components/play-store-link";
import { SiteFooter } from "../../components/site-footer";
import { Accordion } from "../../components/accordion";

const features = [
  {
    title: "Mood boards & emotional arc",
    desc: "See how they’re doing at a glance—mood levels, history, and charts that help you spot patterns before they become problems.",
    icon: Smile,
  },
  {
    title: "Screen-time intelligence",
    desc: "Know where hours go: top apps, balance over the week, and reporting windows that match how your family actually lives.",
    icon: Smartphone,
  },
  {
    title: "Learning progress",
    desc: "Modules, lessons, assignments, and streaks in one hub—so growth shows up as progress you can see and celebrate.",
    icon: BookOpen,
  },
  {
    title: "Family messaging",
    desc: "Stay in the same conversation as your kid—fast, clear parent–child threads when schedules won’t wait.",
    icon: MessageCircle,
  },
  {
    title: "Threat-aware texting",
    desc: "Smart signals when messages look off, urgent, or risky—step in early instead of finding out late.",
    icon: ShieldAlert,
  },
  {
    title: "Alerts that demand attention",
    desc: "What matters rises to the top—so you’re not drowning in noise when something actually needs a parent.",
    icon: Bell,
  },
  {
    title: "Emergency contacts & map",
    desc: "Contacts and location context in reach when safety isn’t theoretical—it’s right now.",
    icon: MapPin,
  },
  {
    title: "Built for every kid in the house",
    desc: "Switch child profiles in seconds—each one gets a clear dashboard, tailored to their world.",
    icon: Users,
  },
];

const whatYouGetFaqs = [
  {
    title: "Mood boards & emotional trends",
    content: (
      <p>
        See how they’re doing at a glance—mood levels, history, and charts
        that help you spot patterns before they become problems.
      </p>
    ),
  },
  {
    title: "Screen-time intelligence",
    content: (
      <p>
        Know where hours go: top apps, balance over the week, and reporting
        windows that match how your family actually lives.
      </p>
    ),
  },
  {
    title: "Learning progress",
    content: (
      <p>
        Modules, lessons, assignments, and streaks in one hub—so growth
        shows up as progress you can see and celebrate.
      </p>
    ),
  },
  {
    title: "Alerts & safer messaging",
    content: (
      <p>
        Family messaging, threat-aware texting, and alerts that demand
        attention—so nothing risky slips by unnoticed.
      </p>
    ),
  },
];

export default function GuardianePage() {
  return (
    <>
      <main className="min-h-screen overflow-x-clip bg-white text-[var(--foreground)]">
        <section className="bg-white mt-10">
          <div className="clarity-wrap px-6 py-12 mt-6">
            <div className="grid gap-2 lg:grid-cols-2 lg:items-center ">
              <div
                data-reveal
                className="relative z-10 flex flex-col items-start gap-6 text-left"
              >
              <span className="inline-flex rounded-full border border-[var(--button-border)] bg-[var(--button-bg)] px-4 py-1.5 text-[0.78rem] font-medium tracking-wide text-[var(--muted)]">
                Clarity for parents. Calm for families.
              </span>
              <h1 className="gradient-heading text-[2.35rem] font-normal leading-[1.06] tracking-[-0.04em] sm:text-[2.85rem] lg:text-[3.15rem]">
                Know their world
                <br className="hidden sm:block" /> before the noise wins
              </h1>
              <p className="clarity-prose max-w-xl text-base sm:text-lg">
                Guardiané turns scattered signals—{" "}
                <strong className="font-semibold text-[var(--foreground)]">
                  mood
                </strong>
                ,{" "}
                <strong className="font-semibold text-[var(--foreground)]">
                  screen time
                </strong>
                ,{" "}
                <strong className="font-semibold text-[var(--foreground)]">
                  learning
                </strong>
                ,{" "}
                <strong className="font-semibold text-[var(--foreground)]">
                  messages
                </strong>
                —into one story, with alerts when something needs you now.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-visible-ring store-btn"
                  aria-label="Download on the App Store"
                >
                  <FontAwesomeIcon
                    icon={faApple}
                    className="store-btn-icon"
                    aria-hidden
                  />
                  <span className="store-btn-title">App Store</span>
                </a>
                <PlayStoreLink
                  className="focus-visible-ring store-btn"
                  aria-label="Get it on Google Play"
                >
                  <FontAwesomeIcon
                    icon={faGooglePlay}
                    className="store-btn-icon"
                    aria-hidden
                  />
                  <span className="store-btn-title">Google Play</span>
                </PlayStoreLink>
                <Link
                  href="/chatbot"
                  className="focus-visible-ring store-btn"
                  aria-label="Chat with JoJo"
                >
                  <span className="store-btn-title">Chat with JoJo</span>
                  <span className="pill-btn-icon" aria-hidden>
                    ↗
                  </span>
                </Link>
              </div>
       
              </div>

            <div
              data-reveal
              id="overview"
              className="relative z-10 w-md ml-10 "
            >
              <div className="clarity-card relative z-10 overflow-hidden p-0 mockup-shadow">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-white">
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
                    className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
                    aria-hidden
                  />
                  Live
                </span>
              </div>
              <div className="space-y-3 p-5 text-sm">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm border border-[var(--border)] bg-white px-4 py-3 text-left">
                  Flag anything odd in last night’s thread?
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-[var(--border)] bg-white px-4 py-3 text-left text-[var(--muted)] mb-10">
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
              <div className="flex items-center gap-3 border-t border-[var(--border)] bg-white px-4 py-3">
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
            </div>
        </div>
        </section>


        <section className="bg-white mt-20" id="features">
          <div className="clarity-wrap px-4 py-10 sm:px-6 lg:px-8">
            <div data-reveal className="clarity-section-title mb-14 text-center">
              <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-xs font-medium text-[var(--muted)]">
                Features
              </span>

              <h2 className="gradient-heading mt-5 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                Everything you need to lead with confidence.
              </h2>

              <p className="clarity-prose mx-auto mt-5 max-w-4xl text-sm">
                Mood, screen time, learning, and safety—every signal a parent
                needs, surfaced in one dashboard built for how families
                actually live.
              </p>
            </div>

            <div data-reveal className="marquee-row relative overflow-hidden py-2">
              <div className="marquee-track flex w-max gap-5 px-4">
                {[...features, ...features].map(({ title, desc, icon: Icon }, i) => (
                  <div
                    key={`${title}-${i}`}
                    className="clarity-card group flex w-64 shrink-0 flex-col gap-4 p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-border)] hover:shadow-sm sm:w-72"
                  >
                    <Icon className="h-6 w-6 text-[var(--accent)]" aria-hidden />
                    <div>
                      <h3 className="text-[15px] font-semibold leading-snug text-[var(--foreground)]">
                        {title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white" id="families">
          <div className="clarity-wrap px-4 py-24 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div data-reveal>
                <h2 className="gradient-heading mb-6 text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[3rem]">
                  What you actually get
                </h2>
                <p className="clarity-prose text-sm">
                  Mood, screen time, learning, and messaging—one dashboard
                  that turns scattered signals into a clear, single story.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {["Busy parents", "School nights", "Blended homes", "Teen years"].map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div data-reveal>
                <Accordion items={whatYouGetFaqs} />
              </div>
              

              
            </div>
          </div>
        </section>


        <section className="bg-white">
          <div className="clarity-wrap relative flex flex-col items-center overflow-hidden px-4 py-24 text-center sm:px-6 lg:px-8 rounded-xl mb-20 mt-10 shadow-sm">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/cta-bg.jpg)" }}
            />
            <div
              className="absolute -inset-6 scale-110 bg-cover bg-center blur-2xl"
              style={{
                backgroundImage: "url(/cta-bg.jpg)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 55%, black 100%)",
                maskImage:
                  "radial-gradient(circle at center, transparent 55%, black 100%)",
              }}
            />
            <div className="absolute inset-0 bg-white/55" />

            <div data-reveal className="relative z-10 flex max-w-3xl flex-col items-center gap-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Ready when you are
              </p>
              <h2 className="gradient-heading mx-auto max-w-3xl text-[2.1rem] font-normal leading-[1.08] tracking-[-0.04em] sm:text-[2.55rem] lg:text-[2.85rem]">
                Stop guessing.
                <br className="hidden sm:block" /> Start knowing.
              </h2>
              <p className="clarity-prose mx-auto max-w-xl text-base sm:text-lg">
                Download Guardiané and put mood, screen time, learning, and
                safer messaging in one decisive dashboard—built for parents who
                don&apos;t have time for guesswork.
              </p>
              <div
                id="download"
                className="flex flex-col items-center justify-center gap-3 pt-2 scroll-mt-28 sm:flex-row sm:flex-wrap"
              >
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-visible-ring store-btn"
                  aria-label="Download on the App Store"
                >
                  <FontAwesomeIcon
                    icon={faApple}
                    className="store-btn-icon"
                    aria-hidden
                  />
                  <span className="store-btn-title">App Store</span>
                </a>
                <PlayStoreLink
                  className="focus-visible-ring store-btn"
                  aria-label="Get it on Google Play"
                >
                  <FontAwesomeIcon
                    icon={faGooglePlay}
                    className="store-btn-icon"
                    aria-hidden
                  />
                  <span className="store-btn-title">Google Play</span>
                </PlayStoreLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter tagline="Guardiané turns scattered signals into a single story—mood boards, screen-time intelligence, learning progress, and threat-aware family messaging." />
    </>
  );
}
