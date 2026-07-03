import Link from "next/link";

import { PartnerWithUsModal } from "./partner-with-us-modal";
import { contactEmail, supportPath } from "../lib/siteConfig";

export function SiteFooter({ tagline }) {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/"
            className="focus-visible-ring mb-3 flex items-center gap-2.5"
          >
            <span className="center-monogram" aria-hidden>
              AIG
            </span>
            <span className="text-base">AI-Guardian Center</span>
          </Link>
          <p className="max-w-sm text-sm text-[var(--muted)]">
            {tagline ??
              "Protecting children's digital safety and mental wellbeing through responsible AI innovation. Home of Guardiané—real-time safety intelligence for families."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Center
            </p>
            <Link
              href="/#about"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              About
            </Link>
            <Link
              href="/#team"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Team
            </Link>
            <Link
              href="/#careers"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Careers
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Product
            </p>
            <Link
              href="/guardiane"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Guardiané
            </Link>
            <Link
              href="/#why"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Why Us
            </Link>
            <Link
              href="/#scholarship"
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Scholarship
            </Link>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Legal
            </p>
            <span className="block text-[var(--muted)]">Privacy Policy</span>
            <span className="block text-[var(--muted)]">Terms of Service</span>
          </div>
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Contact
            </p>
            <Link
              href={supportPath}
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Support
            </Link>
            <a
              href={`mailto:${contactEmail}`}
              className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Contact Us
            </a>
            <PartnerWithUsModal
              email={contactEmail}
              className="focus-visible-ring block text-left text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              Partner With Us
            </PartnerWithUsModal>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6 lg:px-8">
        © {new Date().getFullYear()} AI-Guardian Center. All rights reserved.
      </div>
    </footer>
  );
}
