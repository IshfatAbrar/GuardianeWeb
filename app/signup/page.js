'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Lock, Users, Zap } from 'lucide-react'
import { SiteFooter } from '../../components/site-footer'
import { AuthGuard } from '../../components/auth-guard'
import { signUp } from '../lib/authHelper'
import { Stepper } from './_components/Stepper'
import { StepAccount } from './_components/steps/StepAccount'
import { StepAddChild } from './_components/steps/StepAddChild'
import { StepManageChildren } from './_components/steps/StepManageChildren'
import { StepAppBlocking } from './_components/steps/StepAppBlocking'
import { StepDeviceSetup } from './_components/steps/StepDeviceSetup'
import { StepDone } from './_components/steps/StepDone'

const WHY_FEATURES = [
  { Icon: Zap,   title: 'Set up in 2 minutes', desc: 'Guided onboarding gets your first child profile live fast.' },
  { Icon: Bell,  title: 'Instant alerts',      desc: 'Push notifications for high-risk signals, day or night.' },
  { Icon: Lock,  title: 'Privacy by design',   desc: 'Your data is never sold. COPPA and GDPR compliant.' },
  { Icon: Users, title: 'Expert support',      desc: 'Access vetted counselors and child safety specialists.' },
]

export default function SignupPage() {
  const [step, setStep] = useState(0)        // 0–4, then 'done'
  const [account, setAccount] = useState(null) // { fullName, email, password, agreed }
  const [children, setChildren] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const addChild = (child) => setChildren((prev) => [...prev, child])
  const removeChild = (i) => setChildren((prev) => prev.filter((_, idx) => idx !== i))

  const handleFinish = async () => {
    if (!account) {
      setSubmitError('Account details are missing. Please go back to step 1.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const trimmedName = account.fullName.trim()
      await signUp(account.email, account.password, trimmedName, { children })
      setStep('done')
    } catch (e) {
      const code = e?.code ?? ''
      if (code === 'auth/email-already-in-use') setSubmitError('An account with this email already exists. Try logging in.')
      else if (code === 'auth/invalid-email') setSubmitError('Please enter a valid email address.')
      else if (code === 'auth/weak-password') setSubmitError('Password is too weak.')
      else if (code === 'permission-denied') setSubmitError('Firestore rules rejected the write. Check the browser console for the failing operation.')
      else setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepAccount
            initial={account}
            onNext={(data) => { setAccount(data); setStep(1) }}
          />
        )
      case 1:
        return (
          <StepAddChild
            onNext={(child) => { addChild(child); setStep(2) }}
            onBack={() => setStep(0)}
          />
        )
      case 2:
        return (
          <StepManageChildren
            childList={children}
            onAdd={addChild}
            onRemove={removeChild}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )
      case 3:
        return <StepAppBlocking onNext={() => setStep(4)} onBack={() => setStep(2)} />
      case 4:
        return (
          <StepDeviceSetup
            onFinish={handleFinish}
            onBack={() => setStep(3)}
            submitting={submitting}
            error={submitError}
          />
        )
      case 'done':
        return <StepDone />
    }
  }

  return (
    <AuthGuard mode="public">
      <div className="clarity-hero text-[var(--foreground)]">

        {/* ── HERO / SIGNUP ── */}
        <section className="border-b border-[var(--border)]">
          <div className="mx-auto max-w-[960px]  py-14 lg:py-20">
            <div className="mb-10 text-center" data-reveal>
              <h1 className="font-serif text-3xl font-normal tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-[2.75rem]">
                Create your Guardiané account
              </h1>
              <p className="mt-3 text-[0.85rem] text-[var(--muted)]">
                Set up your parent portal in minutes
              </p>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)]">
              {step !== 'done' && <Stepper current={step} />}
              <div className=" py-8 sm:px-10">
                {renderStep()}
              </div>
            </div>

            {step !== 'done' && (
              <p className="mt-6 text-center text-[0.78rem] text-[var(--muted)]">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-[var(--accent)] hover:underline">
                  Log in
                </Link>
              </p>
            )}
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
              {WHY_FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-[var(--surface)] p-7">
                  <span className="mb-3.5 block">
                    <Icon className="h-[28px] w-[28px] text-[var(--accent)]" strokeWidth={1.8} />
                  </span>
                  <h4 className="mb-1.5 text-[0.84rem] font-semibold text-[var(--foreground)]">{title}</h4>
                  <p className="text-[0.76rem] leading-[1.65] text-[var(--muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter tagline="Protecting children's digital safety and mental wellbeing through responsible AI innovation." />

      </div>
    </AuthGuard>
  )
}
