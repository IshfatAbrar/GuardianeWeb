import Image from "next/image";
import Link from "next/link";

import { PartnerWithUsModal } from "./partner-with-us-modal";
import { contactEmail, supportPath } from "../lib/siteConfig";

export function SiteFooter({ tagline }) {
  return (
    <footer className="bg-[var(--surface)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="focus-visible-ring mb-3 flex items-center gap-2"
            >
              <Image
                src="/guardian-icon.png"
                alt=""
                width={26}
                height={30}
                className="brand-icon shrink-0"
              />
              <span className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
                Guardiané AI
              </span>
            </Link>
            <p className="text-sm text-[var(--muted)]">
              {tagline ??
                "Protecting children's digital safety and mental wellbeing through responsible AI innovation. Home of Guardiané—real-time safety intelligence for families."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:gap-16">
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
                Contact
              </p>
              <Link
                href={supportPath}
                className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Support
              </Link>
              <PartnerWithUsModal
                email={contactEmail}
                className="focus-visible-ring block text-left text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Partner With Us
              </PartnerWithUsModal>
            </div>
          </div>

          
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} AI-Guardian Center. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
