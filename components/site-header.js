import Link from "next/link";
import { PartnerWithUsModal } from "./partner-with-us-modal";
import { ThemeToggle } from "./theme-toggle";
import { contactEmail, mainNavLinks } from "../lib/siteConfig";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 glass clarity-hero">
      <nav className="clarity-wrap flex items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <ul className="hidden items-center gap-7 text-[0.8rem] font-medium text-[var(--muted)] lg:flex">
          {mainNavLinks.map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                className={`focus-visible-ring transition-colors hover:text-[var(--foreground)]${
                  label === "Guardiané"
                    ? " inline-flex items-center gap-1"
                    : ""
                }`}
              >
                {label}
                {label === "Guardiané" ? (
                  <span className="pill-btn-icon" aria-hidden>
                    ↗
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 font-sans">
          <ThemeToggle />
          <PartnerWithUsModal
            email={contactEmail}
            className="focus-visible-ring outline-btn px-4 py-2 text-[0.78rem] font-medium"
          >
            Partner With Us
          </PartnerWithUsModal>
        </div>
      </nav>
    </header>
  );
}
