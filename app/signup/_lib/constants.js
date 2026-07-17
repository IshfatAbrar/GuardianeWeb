export const STEPS = [
  { label: 'Account' },
  { label: 'Add child' },
  { label: 'Manage' },
  { label: 'Device setup' },
]

export const GRADES = [
  'Kindergarten',
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
]

export const STRENGTH_META = [
  { label: 'Weak', color: 'bg-red-400' },
  { label: 'Fair', color: 'bg-amber-400' },
  { label: 'Good', color: 'bg-emerald-400' },
  { label: 'Strong', color: 'bg-emerald-600' },
]

export const inputCls =
  'w-full rounded border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 font-sans text-sm text-[var(--foreground)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]'
