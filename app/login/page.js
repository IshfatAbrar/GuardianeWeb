'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { contactEmail } from '../../lib/siteConfig'
import { PartnerWithUsModal } from '../../components/partner-with-us-modal'
import { signIn } from "../lib/authHelper"  // ← Firebase helper
import {
  ShieldCheck,
  MessageCircleHeart,
  BookOpen,
  Stethoscope,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSignIn = async () => {
    setError('')

    // Basic client-side guard
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err) {
      // Map Firebase error codes to friendly messages
      const code = err?.code ?? ''
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.')
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Allow Enter key to submit
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSignIn()
  }

  return (
    <div className="clarity-hero text-[var(--foreground)]">

      {/* ── HERO / LOGIN ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto grid max-w-[1120px] gap-16 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8 lg:py-28">

          {/* LEFT: Copy */}
          <div className="clarity-copy mt-10" data-reveal>
            <h1 className="mb-5 max-w-3xl bg-[var(--foreground)] bg-clip-text text-4xl font-normal leading-[1.06] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              Your family&apos;s<br />safety dashboard
            </h1>

            <p className="mt-5 max-w-2xl text-xl leading-relaxed text-[var(--foreground)]">
              Monitor your children&apos;s digital wellbeing, track emotional health signals, and connect with trusted counselors — all in one place.
            </p>

            <p className="clarity-prose mt-6 max-w-2xl text-[0.95rem] leading-[1.85]">
              Guardiané&apos;s parent portal brings together real-time risk detection, learning progress, mood analytics, and screen-time insights so every family has the visibility they need to stay safe and supported.
            </p>
          </div>

          {/* RIGHT: Login Card */}
          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-10 py-11 shadow-[0_4px_24px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="mb-8">
              <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-widest text-[var(--muted)]">
                Parent portal
              </p>
              <h2 className="mb-1.5 font-serif text-[1.9rem] font-normal leading-[1.1] tracking-tight">
                Sign in
              </h2>
              <p className="text-[0.82rem] text-[var(--muted)]">
                Welcome back — access your dashboard
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.78rem] text-red-700">
                {error}
              </div>
            )}

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
                onKeyDown={handleKeyDown}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="mb-2 block text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>

            {/* Forgot password */}
            <div className="mb-6 flex justify-end">
              <Link href="/forgot-password" className="text-[0.76rem] text-[var(--accent)] no-underline hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="w-full rounded bg-[var(--accent)] px-3 py-3.5 font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign in →'}
              </button>

              <div className="flex items-center gap-3 text-[0.74rem] text-[var(--muted)]">
                <div className="h-px flex-1 bg-[var(--border)]" />
                or
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <Link
                href="/signup"
                className="w-full rounded border border-[var(--accent-border)] bg-[var(--accent-bg)] px-3 py-3 text-center font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-[var(--accent)] transition-all hover:bg-[var(--accent-bg-hover)] no-underline"
              >
                Create an account
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
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-9">
            <h2 className="mb-2 bg-[var(--foreground)] bg-clip-text text-3xl font-normal leading-[1.08] tracking-tight text-transparent sm:text-4xl">
              What you get access to
            </h2>
            <p className="text-[0.85rem] text-[var(--muted)]">
              Everything a parent needs to protect, support, and empower their children online.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck,        title: 'Live risk detection', desc: 'AI flags concerning digital activity patterns in real time before they escalate.' },
              { icon: MessageCircleHeart, title: 'Mood & wellbeing',    desc: 'Daily mood logs and streak analytics give you an emotional pulse on each child.' },
              { icon: BookOpen,           title: 'Learning progress',   desc: 'Track completion of assigned digital safety and resilience modules.' },
              { icon: Stethoscope,        title: 'Counselor connect',   desc: 'Seamless access to vetted mental health professionals when your family needs support.' },
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
              <Link href="/guardiane" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Guardiané</Link>
              <Link href="#why"        className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Why Us</Link>
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
  )
}