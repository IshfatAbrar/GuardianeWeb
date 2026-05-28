import { useState } from 'react'
import Link from 'next/link'
import { inputCls, STRENGTH_META } from '../../_lib/constants'
import { getPasswordStrength } from '../../_lib/helpers'
import { ErrorBanner, Field, StepCard, StepFooter } from '../StepShell'
import { PasswordInput } from '../../../../components/password-input'

export function StepAccount({ initial, onNext }) {
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
            <input
              type="text"
              className={inputCls}
              placeholder="Sarah Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>

          <Field label={<>Email address{requiredStar}</>}>
            <input
              type="email"
              className={inputCls}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={<>Password{requiredStar}</>}>
            <PasswordInput
              className={inputCls}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            <PasswordInput
              className={inputCls}
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
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
          <Link href="#" className="text-[var(--accent)] no-underline hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-[var(--accent)] no-underline hover:underline">
            Privacy Policy
          </Link>
        </span>
      </label>

      <StepFooter onNext={handleNext} nextLabel="Continue →" nextDisabled={!agreed} />
    </StepCard>
  )
}
