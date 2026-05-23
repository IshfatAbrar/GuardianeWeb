'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Plus, Trash2, X, Smartphone, Bell, Lock, Zap, Users } from 'lucide-react'
import { AuthGuard } from '../../components/auth-guard'
import { signUp } from '../lib/authHelper'

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const STEPS = [
  { label: 'Account' },
  { label: 'Add child' },
  { label: 'Manage' },
  { label: 'App blocking' },
  { label: 'Device setup' },
]

const GRADES = [
  'Kindergarten',
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
]

const APP_SUGGESTIONS = ['TikTok', 'Instagram', 'Snapchat', 'YouTube', 'Roblox']

const APP_ICONS = {
  tiktok: '🎵',
  instagram: '📸',
  snapchat: '👻',
  youtube: '▶️',
  roblox: '🎮',
}

function getPasswordStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

const STRENGTH_META = [
  { label: 'Weak', color: 'bg-red-400' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-emerald-400' },
  { label: 'Strong', color: 'bg-emerald-600' },
]

function getAge(bday) {
  if (!bday) return '?'
  return Math.floor((Date.now() - new Date(bday)) / 31_557_600_000)
}

function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Top stepper bar — number + label inline, segmented progress underneath */
function Stepper({ current }) {
  return (
    <div className="border-b border-[var(--border)] pt-7 ">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        {STEPS.map((s, i) => {
          const active = i === current
          const done = i < current
          const align = 'text-center'
          return (
            <div
              key={s.label}
              className={`flex-1 truncate text-[0.78rem] transition-colors  ${align} ${
                active
                  ? 'font-semibold text-[var(--accent)]'
                  : done
                  ? 'font-medium text-[var(--foreground)]'
                  : 'font-medium text-[var(--muted)]'
              }`}
            >
              {i + 1}. {s.label}
            </div>
          )
        })}
      </div>
      <div className="flex w-full">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 transition-colors duration-300 ${
              i <= current ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/** Reusable labelled input */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]'

/** Error banner */
function ErrorBanner({ msg }) {
  if (!msg) return null
  return (
    <div className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-[0.78rem] text-red-700">
      {msg}
    </div>
  )
}

/** Step content wrapper (rendered inside the outer card) */
function StepCard({ title, sub, children }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {(title || sub) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-serif text-[1.5rem] font-normal leading-[1.15] tracking-tight text-[var(--foreground)]">
              {title}
            </h2>
          )}
          {sub && (
            <p className="mt-1 text-[0.82rem] text-[var(--muted)]">{sub}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/** Footer nav row */
function StepFooter({ onBack, onNext, nextLabel = 'Continue →', nextDisabled = false }) {
  return (
    <div className="mt-8 flex items-center justify-between pt-2">
      {onBack ? (
        <button
          onClick={onBack}
          className="rounded border border-[var(--border)] bg-transparent px-4 py-2.5 font-sans text-[0.75rem] font-medium text-[var(--muted)] transition hover:bg-[var(--background)]"
        >
          ← Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="rounded bg-[var(--accent)] px-5 py-2.5 font-sans text-[0.75rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {nextLabel}
      </button>
    </div>
  )
}

/** Child profile card */
function ChildCard({ child, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] font-sans text-[0.75rem] font-semibold text-[var(--accent)]">
        {getInitials(child.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[0.84rem] font-medium text-[var(--foreground)]">{child.name}</p>
        <p className="text-[0.72rem] text-[var(--muted)]">
          {getAge(child.bday)} yrs · {child.grade} · {child.gender}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="rounded p-1.5 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        aria-label="Remove child"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

/** Inline add-child form (reused in steps 2 and 3) */
function ChildForm({ onSave, onCancel, saveLabel = 'Add child →' }) {
  const [name, setName] = useState('')
  const [bday, setBday] = useState('')
  const [gender, setGender] = useState('')
  const [grade, setGrade] = useState('')
  const [err, setErr] = useState('')

  const handleSave = () => {
    if (!name || !bday || !gender || !grade) {
      setErr('Please complete all fields.')
      return
    }
    setErr('')
    onSave({ name, bday, gender, grade })
  }

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] px-5 py-5">
      <ErrorBanner msg={err} />
      <div className="grid gap-4">
        <Field label="Child's full name">
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Emma Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <input
              type="date"
              className={inputCls}
              value={bday}
              onChange={(e) => setBday(e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select…</option>
              {['Girl', 'Boy', 'Non-binary', 'Prefer not to say'].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="School grade">
          <select className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">Select grade…</option>
            {GRADES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded border border-[var(--border)] px-4 py-2 font-sans text-[0.72rem] font-medium text-[var(--muted)] transition hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="rounded bg-[var(--accent)] px-5 py-2 font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)]"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   STEP PAGES
───────────────────────────────────────────── */

/** Step 1: Collect account details (account is actually created at the final step) */
function StepAccount({ initial, onNext }) {
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState(initial?.password ?? '')
  const [confirm, setConfirm] = useState(initial?.password ?? '')
  const [agreed, setAgreed] = useState(initial?.agreed ?? false)
  const [err, setErr] = useState('')

  const strength = password ? getPasswordStrength(password) : 0
  const meta = STRENGTH_META[Math.max(0, strength - 1)]

  const handleNext = () => {
    setErr('')
    const trimmedName = fullName.trim()
    if (!trimmedName) return setErr('Please enter your full name.')
    if (!email) return setErr('Please enter your email address.')
    if (!password || password.length < 8) return setErr('Password must be at least 8 characters.')
    if (password !== confirm) return setErr('Passwords do not match.')
    if (!agreed) return setErr('Please agree to the Terms of Service and Privacy Policy.')

    onNext({ fullName: trimmedName, email, password, agreed })
  }

  const requiredStar = <span className="ml-0.5 text-red-500">*</span>

  return (
    <StepCard title="Account details" sub="Tell us a bit about yourself">
      <ErrorBanner msg={err} />
      <div className="grid gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={<>Full name{requiredStar}</>}>
            <input type="text" className={inputCls} placeholder="Sarah Johnson" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          
          <Field label={<>Email address{requiredStar}</>}>
            <input type="email" className={inputCls} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={<>Password{requiredStar}</>}>
            <input type="password" className={inputCls} placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
            {password && (
              <div className="mt-1">
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
                <p className="mt-1 text-[0.65rem] text-[var(--muted)]">{meta.label}</p>
              </div>
            )}
          </Field>
          <Field label={<>Confirm password{requiredStar}</>}>
            <input type="password" className={inputCls} placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
        </div>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 accent-[var(--accent)]"
        />
        <span className="text-[0.75rem] leading-relaxed text-[var(--muted)]">
          I agree to the{' '}
          <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="#" className="text-[var(--accent)] no-underline hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <StepFooter
        onNext={handleNext}
        nextLabel="Continue →"
        nextDisabled={!agreed}
      />
    </StepCard>
  )
}

/** Step 2: Add your child */
function StepAddChild({ onNext, onBack }) {
  const handleSave = (child) => onNext(child)
  return (
    <StepCard title="Add your child" sub="Enter your child's details to set up their profile">
      <ChildForm onSave={handleSave} onCancel={onBack} saveLabel="Add child →" />
    </StepCard>
  )
}

/** Step 3: Manage children */
function StepManageChildren({ children, onAdd, onRemove, onNext, onBack }) {
  const [showForm, setShowForm] = useState(false)

  const handleAdd = (child) => {
    onAdd(child)
    setShowForm(false)
  }

  return (
    <StepCard title="Manage children" sub="Review and edit your children's profiles">
      <div className="grid gap-2.5">
        {children.map((c, i) => (
          <ChildCard key={i} child={c} onRemove={() => onRemove(i)} />
        ))}
      </div>

      {showForm ? (
        <div className="mt-4">
          <ChildForm onSave={handleAdd} onCancel={() => setShowForm(false)} saveLabel="Save child" />
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded border-[1.5px] border-dashed border-[var(--accent-border)] py-3 font-sans text-[0.78rem] font-medium text-[var(--accent)] transition hover:bg-[var(--accent-bg)]"
        >
          <Plus className="h-4 w-4" />
          Add another child
        </button>
      )}

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue →" />
    </StepCard>
  )
}

/** Step 4: App blocking */
function StepAppBlocking({ onNext, onBack }) {
  const [enabled, setEnabled] = useState(false)
  const [query, setQuery] = useState('')
  const [blockedApps, setBlockedApps] = useState([])

  const addApp = (name) => {
    const val = name || query.trim()
    if (!val || blockedApps.includes(val)) return
    setBlockedApps((prev) => [...prev, val])
    setQuery('')
  }

  const removeApp = (i) => setBlockedApps((prev) => prev.filter((_, idx) => idx !== i))

  return (
    <StepCard title="App blocking" sub="Choose whether to restrict apps on your children's devices">
      {/* Toggle row */}
      <div className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--background)] px-5 py-4">
        <div>
          <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">Enable app blocking</p>
          <p className="mt-0.5 text-[0.72rem] text-[var(--muted)]">Prevent access to specific apps on linked devices</p>
        </div>
        {/* Toggle switch */}
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-5 grid gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <Field label="Search apps to block">
            <div className="flex gap-2">
              <input
                type="text"
                className={`${inputCls} flex-1`}
                placeholder="e.g. TikTok, Instagram…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addApp()}
              />
              <button
                onClick={() => addApp()}
                className="rounded bg-[var(--accent)] px-4 font-sans text-[0.72rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)] whitespace-nowrap"
              >
                Block
              </button>
            </div>
          </Field>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {APP_SUGGESTIONS.filter((a) => !blockedApps.includes(a)).map((a) => (
              <button
                key={a}
                onClick={() => addApp(a)}
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 font-sans text-[0.72rem] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                + {a}
              </button>
            ))}
          </div>

          {/* Blocked list */}
          {blockedApps.length > 0 && (
            <div className="grid gap-2">
              {blockedApps.map((app, i) => {
                const icon = APP_ICONS[app.toLowerCase()] ?? '📱'
                return (
                  <div key={i} className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--background)] px-4 py-3">
                    <span className="text-lg">{icon}</span>
                    <span className="flex-1 font-sans text-[0.84rem] font-medium text-[var(--foreground)]">{app}</span>
                    <span className="rounded bg-red-50 px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-red-600">
                      Blocked
                    </span>
                    <button
                      onClick={() => removeApp(i)}
                      className="ml-1 rounded p-1 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                      aria-label="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Continue →" />
    </StepCard>
  )
}

/** Step 5: Device setup */
function StepDeviceSetup({ onFinish, onBack, submitting, error }) {
  const instructions = [
    {
      title: 'Download the Guardiané companion app',
      desc: 'Available on iOS App Store and Google Play. Search "Guardiané Child".',
    },
    {
      title: 'Sign in with your parent account',
      desc: 'Use the same email and password you just created.',
    },
    {
      title: 'Select the child\'s profile',
      desc: 'Choose which profile to link to this device. You can connect multiple devices per child.',
    },
    {
      title: 'Grant required permissions',
      desc: 'Allow screen time, notifications, and accessibility as prompted. These are required for monitoring.',
    },
  ]

  return (
    <StepCard title="Connect your child's device" sub="Follow these steps to link the device">
      <ErrorBanner msg={error} />

      {/* Illustration placeholder */}
      <div className="mb-6 flex flex-col items-center justify-center rounded border border-dashed border-[var(--border)] bg-[var(--background)] py-10 text-center">
        <Smartphone className="mb-3 h-10 w-10 text-[var(--border)]" strokeWidth={1.2} />
        <p className="text-[0.75rem] text-[var(--muted)]">Device connection illustration</p>
      </div>

      {/* Steps */}
      <div className="divide-y divide-[var(--border)]">
        {instructions.map((s, i) => (
          <div key={i} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] font-sans text-[0.72rem] font-semibold text-[var(--accent)]">
              {i + 1}
            </div>
            <div>
              <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">{s.title}</p>
              <p className="mt-0.5 text-[0.75rem] leading-[1.6] text-[var(--muted)]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onFinish}
        nextLabel={submitting ? 'Creating account…' : 'Finish setup →'}
        nextDisabled={submitting}
      />
    </StepCard>
  )
}

/** Success screen */
function StepDone() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
        <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
      </div>
      <h2 className="mb-2 font-serif text-[1.9rem] font-normal tracking-tight text-[var(--foreground)]">
        You're all set!
      </h2>
      <p className="mb-8 max-w-xs text-[0.85rem] leading-relaxed text-[var(--muted)]">
        Your Guardiané parent portal is ready. Head to your dashboard to start protecting your family.
      </p>
      <button
        onClick={() => router.push('/dashboard')}
        className="rounded bg-[var(--accent)] px-7 py-3.5 font-sans text-[0.78rem] font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--accent-hover)] active:translate-y-0.5"
      >
        Go to dashboard →
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function SignupPage() {
  const [step, setStep] = useState(0)      // 0-4, then 'done'
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
            children={children}
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
            {/* Centered title */}
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
              {[
                { Icon: Zap, title: 'Set up in 2 minutes', desc: 'Guided onboarding gets your first child profile live fast.' },
                { Icon: Bell, title: 'Instant alerts', desc: 'Push notifications for high-risk signals, day or night.' },
                { Icon: Lock, title: 'Privacy by design', desc: 'Your data is never sold. COPPA and GDPR compliant.' },
                { Icon: Users, title: 'Expert support', desc: 'Access vetted counselors and child safety specialists.' },
              ].map(({ Icon, title, desc }) => (
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
                <Link href="#about" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">About</Link>
                <Link href="#team" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Team</Link>
                <Link href="#careers" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Careers</Link>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Product</p>
                <Link href="/guardiane" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Guardiané</Link>
                <Link href="#why" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Why Us</Link>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Legal</p>
                <span className="block text-[var(--muted)]">Privacy Policy</span>
                <span className="block text-[var(--muted)]">Terms of Service</span>
              </div>
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">Contact</p>
                <a href="mailto:hello@example.com" className="focus-visible-ring block text-[var(--muted)] hover:text-[var(--foreground)]">Contact Us</a>
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