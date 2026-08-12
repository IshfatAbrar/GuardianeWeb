'use client'

// App-wide toast notifications, mounted once at the root layout (mirrors
// NotificationsProvider's pattern: a context + provider wrapping the whole
// tree, since most silent-success actions — like module assignment — live
// several layers below any single page).

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext({ showToast: () => {} })

const AUTO_DISMISS_MS = 3500

function makeToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  // type: 'success' | 'error'. Auto-dismisses so a parent moving fast through
  // several assignments doesn't have to clear each toast by hand.
  const showToast = useCallback(
    (message, type = 'success') => {
      const id = makeToastId()
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS),
      )
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-elevated)] backdrop-blur-sm ${
            t.type === 'error'
              ? 'border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
          }`}
        >
          {t.type === 'error' ? (
            <svg width="16" height="16" className="flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          ) : (
            <svg width="16" height="16" className="flex-shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <span className="flex-1 text-[13px] font-medium">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="flex-shrink-0 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
