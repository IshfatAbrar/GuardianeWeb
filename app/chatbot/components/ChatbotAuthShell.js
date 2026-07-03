'use client'

import Link from 'next/link'
import { ThemeToggle } from '../../../components/theme-toggle'

// Official multi-color brand marks, inlined so each renders in its exact logo
// colors (Font Awesome's single-path icons can only be one flat color).
function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden {...props}>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.18 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#1877F2" aria-hidden {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  )
}

// GitHub's mark is monochrome — currentColor lets it follow the theme
// foreground so it stays visible in both light and dark mode.
function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  )
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="#0A66C2" aria-hidden {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

// Social sign-in isn't wired up (JoJo is a passwordless email/phone flow), so
// these render as disabled "coming soon" buttons to match the mockup.
const SOCIAL_PROVIDERS = [
  { Icon: GoogleIcon, label: 'Google' },
  { Icon: FacebookIcon, label: 'Facebook' },
  { Icon: GithubIcon, label: 'GitHub' },
  { Icon: LinkedinIcon, label: 'LinkedIn' },
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
                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)]"
              >
                <p.Icon className="h-4 w-4" />
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
