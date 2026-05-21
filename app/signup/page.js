'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Zap,
  Bell,
  Lock,
  Users,
} from 'lucide-react'
import { contactEmail } from '../../lib/siteConfig'
import { PartnerWithUsModal } from '../../components/partner-with-us-modal'
import { AuthGuard } from '../../components/auth-guard'
import { signUp } from '../lib/authHelper'   // ← Firebase helper

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [numChildren, setNumChildren] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')

  // Password strength: 0–4
  const getStrength = (pw) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return score
  }

  const strengthMeta = [
    { label: 'Weak',   color: 'bg-red-400' },
    { label: 'Fair',   color: 'bg-amber-400' },
    { label: 'Good',   color: 'bg-emerald-400' },
    { label: 'Strong', color: 'bg-emerald-600' },
  ]

  const strength = password ? getStrength(password) : 0
  const meta = strengthMeta[Math.max(0, strength - 1)]

  const handleSignUp = async () => {
    setError('')

    // Client-side guards
    if (!firstName || !lastName) {
      setError('Please enter your first and last name.')
      return
    }
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }

    setIsLoading(true)
    try {
      const { user, profile } = await signUp(
        email,
        password,
        `${firstName} ${lastName}`.trim(),
        { firstName, lastName, numChildren },
      )
      console.log('[GUARDIANE-DB] signup: new user →', user)
      console.log('[GUARDIANE-DB] signup: Firestore profile →', profile)
      router.push('/onboarding')
    } catch (err) {
      const code = err?.code ?? ''
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard mode="public">
    <div className="clarity-hero text-[var(--foreground)]">

      {/* ── HERO / SIGNUP ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-[1120px] gap-16 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8 lg:py-28">

          {/* RIGHT: Signup Card */}
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-10 py-11 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-8">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                Create your account
              </p>
              <h2 className="mb-1.5 font-serif text-[1.9rem] font-normal leading-[1.1] tracking-tight">
                Get started free
              </h2>
              <p className="text-[0.82rem] text-[var(--muted)]">
                Set up your parent portal in minutes
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.78rem] text-red-700">
                {error}
              </div>
            )}

            {/* Name row */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                  First name
                </label>
                <input
                  type="text"
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Last name
                </label>
                <input
                  type="text"
                  placeholder="Johnson"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>

            {/* Password + strength */}
            <div className="mb-5">
              <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? meta.color : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[0.68rem] text-[var(--muted)]">{meta.label}</p>
                </div>
              )}
            </div>

            {/* Number of children */}
            <div className="mb-6">
              <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                Number of children to monitor
              </label>
              <input
                type="number"
                min={1}
                max={10}
                placeholder="e.g. 2"
                value={numChildren}
                onChange={(e) => setNumChildren(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>

            {/* Terms */}
            <label className="mb-6 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 accent-[var(--accent)]"
              />
              <span className="text-[0.76rem] leading-relaxed text-[var(--muted)]">
                I agree to the{' '}
                <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSignUp}
                disabled={isLoading || !agreed}
                className="w-full rounded bg-[var(--accent)] px-3 py-3.5 font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Creating account…' : 'Create account →'}
              </button>

              <div className="flex items-center gap-3 text-[0.74rem] text-[var(--muted)]">
                <div className="h-px flex-1 bg-[var(--border)]" />
                already have an account?
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <Link
                href="/login"
                className="w-full rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-3 text-center font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-[var(--accent)] transition-all hover:bg-[var(--accent-bg-hover)] no-underline"
              >
                Log in
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-6 border-t border-[var(--border)] pt-4 text-center text-[0.7rem] leading-relaxed text-[var(--muted)]">
              Protected by 256-bit encryption&nbsp;·&nbsp;
              <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Privacy Policy</Link>
              &nbsp;·&nbsp;
              <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Terms of Service</Link>
            </div>
          </div>

          {/* LEFT: Copy */}
          <div className="clarity-copy mt-10" data-reveal>
            <h1 className="mb-5 max-w-3xl bg-[var(--foreground)] bg-clip-text text-4xl font-normal leading-[1.06] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Protect what<br />matters most
            </h1>

            <p className="mt-5 max-w-2xl text-xl leading-relaxed text-[var(--foreground)]">
              Join thousands of families using Guardiané to keep their children safer online, emotionally healthier, and more supported.
            </p>

            <p className="clarity-prose mt-6 max-w-2xl text-[0.95rem] leading-[1.85]">
              Set up your parent account in under two minutes. Add children, configure monitoring preferences, and get real-time alerts — all from one trusted dashboard built by child safety researchers and psychologists.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHY GUARDIANE ── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-9">
            <h2 className="mb-2 bg-[var(--foreground)] bg-clip-text text-3xl font-normal leading-[1.08] tracking-tight text-transparent sm:text-4xl">
              Why families choose Guardiané
            </h2>
            <p className="text-[0.85rem] text-[var(--muted)]">
              Built by child safety researchers, psychologists, and parents — not just engineers.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap,   title: 'Set up in 2 minutes', desc: 'Guided onboarding gets your first child profile live fast.' },
              { icon: Bell,  title: 'Instant alerts',       desc: 'Push notifications for high-risk signals, day or night.' },
              { icon: Lock,  title: 'Privacy by design',    desc: 'Your data is never sold. COPPA and GDPR compliant.' },
              { icon: Users, title: 'Expert support',       desc: 'Access vetted counselors and child safety specialists.' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="bg-[var(--surface)] p-7 transition-colors">
                  <span className="mb-3.5 block">
                    <Icon className="h-[28px] w-[28px] text-[var(--accent)]" strokeWidth={1.8} />
                  </span>
                  <h4 className="mb-1.5 text-[0.84rem] font-semibold text-[var(--foreground)]">{f.title}</h4>
                  <p className="text-[0.76rem] leading-[1.65] text-[var(--muted)]">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Link href="/" className="focus-visible-ring mb-3 flex items-center gap-2.5">
              <span className="center-monogram" aria-hidden>AIG</span>
              <span className="text-base">AI-Guardian Center</span>
            </Link>
            <p className="max-w-sm text-sm text-[var(--muted)]">
              Protecting children&apos;s digital safety and mental wellbeing through responsible AI innovation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-4">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Center</p>
              <Link href="#about"   className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">About</Link>
              <Link href="#team"    className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Team</Link>
              <Link href="#careers" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Careers</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Product</p>
              <Link href="/guardiane"   className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Guardiané</Link>
              <Link href="#why"         className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Why Us</Link>
              <Link href="#scholarship" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Scholarship</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Legal</p>
              <span className="block text-[var(--muted)]">Privacy Policy</span>
              <span className="block text-[var(--muted)]">Terms of Service</span>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Contact</p>
              <a href={`mailto:${contactEmail}`} className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Contact Us</a>
              <PartnerWithUsModal email={contactEmail} className="focus-visible-ring block text-left text-[var(--muted)] hover:text-[var(--foreground)]">
                Partner With Us
              </PartnerWithUsModal>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] px-4 py-4 text-center text-xs text-[var(--muted)] sm:px-6 lg:px-8">
          © {new Date().getFullYear()} AI-Guardian Center. All rights reserved.
        </div>
      </footer>
    </div>
    </AuthGuard>
  )
}