'use client'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGoogle,
  faFacebookF,
  faGithub,
  faLinkedinIn,
} from '@fortawesome/free-brands-svg-icons'
import { ThemeToggle } from '../../../components/theme-toggle'

// Social sign-in isn't wired up (JoJo is a passwordless email/phone flow), so
// these render as disabled "coming soon" buttons to match the mockup.
const SOCIAL_PROVIDERS = [
  { icon: faGoogle, label: 'Google' },
  { icon: faFacebookF, label: 'Facebook' },
  { icon: faGithub, label: 'GitHub' },
  { icon: faLinkedinIn, label: 'LinkedIn' },
]

// The split-panel auth card from the mockup: white form pane on the left, a
// violet "swoosh" panel on the right that links across to the other flow.
export function ChatbotAuthShell({
  heading,
  children,
  panelTitle,
  panelText,
  panelCtaLabel,
  panelCtaHref,
  switchPrompt,
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[var(--hero-bg)] px-4 pb-8 pt-16 sm:py-10">
      {/* Top controls — in normal flow on mobile (so they never overlap the
          card), pinned to the corners from sm up. */}
      <div className="absolute left-2 right-2 top-3 flex items-center justify-between sm:left-4 sm:right-4 sm:top-4">
        <Link
          href="/chatbot"
          className="rounded-full px-3 py-1.5 text-[0.78rem] font-medium text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
        >
          ← Back to chat
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-[760px] flex-col overflow-hidden rounded-[22px] bg-[var(--surface)] shadow-[var(--shadow-elevated)] lg:min-h-[460px] lg:flex-row">

        {/* ── LEFT: form pane ── */}
        <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-9 sm:py-9 lg:w-1/2">
          <h1 className="text-center text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {heading}
          </h1>

          <div className="mt-4 flex justify-center gap-2.5">
            {SOCIAL_PROVIDERS.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled
                title={`${p.label} sign-in — coming soon`}
                aria-label={`${p.label} sign-in — coming soon`}
                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] opacity-60"
              >
                <FontAwesomeIcon icon={p.icon} className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <p className="mb-4 mt-3 text-center text-[0.78rem] text-[var(--muted)]">
            or use your email or phone
          </p>

          {children}

          {/* Mobile-only cross-link (the side panel is hidden < lg) */}
          <p className="mt-6 text-center text-[0.8rem] text-[var(--muted)] lg:hidden">
            {switchPrompt}{' '}
            <Link href={panelCtaHref} className="font-semibold text-[var(--accent)] hover:underline">
              {panelCtaLabel}
            </Link>
          </p>
        </div>

        {/* ── RIGHT: cross-link panel (desktop only) ── */}
        <div className="relative hidden flex-col items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] px-8 py-10 text-center text-white lg:flex lg:w-1/2 lg:rounded-l-[90px]">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{panelTitle}</h2>
          <p className="mt-4 max-w-xs text-[0.88rem] leading-relaxed text-white/85">
            {panelText}
          </p>
          <Link
            href={panelCtaHref}
            className="mt-7 rounded-full border-2 border-white/80 px-10 py-2.5 text-[0.74rem] font-semibold uppercase tracking-widest text-white no-underline transition-all hover:bg-white hover:text-[var(--accent)]"
          >
            {panelCtaLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
