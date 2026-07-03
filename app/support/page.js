import Link from "next/link";

import { SiteFooter } from "../../components/site-footer";
import { contactEmail, supportEmail } from "../../lib/siteConfig";

export const metadata = {
  title: "Support — Guardiané",
  description:
    "Get help with Guardiané. Contact our support team, browse common topics, and find answers for parents and families.",
};

const HELP_TOPICS = [
  {
    title: "Linking your child's device",
    body:
      "Open the child app on the device you want to link, tap \"Scan to Link\", and point the camera at the QR code shown next to your child's name in the parent dashboard sidebar.",
  },
  {
    title: "Assigning learning modules",
    body:
      "From Module Assignments → Assign Module, pick a child and a module, set a priority and optional due date, then tap Assign.",
  },
  {
    title: "Reviewing access requests",
    body:
      "When your child asks for app access, the request appears in the Access Requests tab. Tap Approve or Deny — for approvals you can also set a time limit and an optional reason.",
  },
  {
    title: "What JoJo can help with",
    body:
      "JoJo is the in-app chatbot for teen safety, mental health, and digital well-being questions. JoJo offers general guidance, not medical or legal advice.",
  },
];

export default function SupportPage() {
  return (
    <>
      <main className="border-t border-[var(--border)]">
        <div className="clarity-wrap px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <p className="clarity-kicker mb-4 text-[var(--accent)]">Help Center</p>
            <h1 className="gradient-heading text-4xl font-normal leading-[1.08] tracking-[-0.04em] sm:text-[2.75rem]">
              Guardiané Support
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[var(--muted)]">
              Need help with the Guardiané app or parent dashboard? Browse common
              topics below or reach our team by email. We usually reply within one
              business day.
            </p>

            <div className="mt-10 space-y-3">
              {HELP_TOPICS.map((topic) => (
                <div
                  key={topic.title}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
                >
                  <h2 className="text-[15px] font-semibold text-[var(--foreground)]">
                    {topic.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {topic.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 space-y-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Contact Support
              </h2>
              <a
                href={`mailto:${supportEmail}?subject=Guardian%C3%A9%20Support`}
                className="focus-visible-ring flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-muted)]"
              >
                <div>
                  <p className="text-[15px] font-semibold text-[var(--foreground)]">
                    {supportEmail}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    Click to compose an email
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  className="text-[var(--accent)]"
                  aria-hidden
                >
                  <path d="M7 17 17 7M7 7h10v10" />
                </svg>
              </a>
              <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 text-sm leading-relaxed text-[var(--muted)]">
                For urgent safety concerns about a child, please contact local
                emergency services. The in-app Crisis Management tab can help you
                do this quickly.
              </p>
            </div>

            <p className="mt-10 text-sm text-[var(--muted)]">
              For partnership or general inquiries, email{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="focus-visible-ring font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {contactEmail}
              </a>
              . Learn more about Guardiané on the{" "}
              <Link
                href="/guardiane"
                className="focus-visible-ring font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                product page
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <SiteFooter tagline="Protecting children's digital safety and mental wellbeing through responsible AI innovation." />
    </>
  );
}
