'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ThemeToggle } from './theme-toggle'
import { NotificationPanel } from './notification-panel'
import { mainNavLinks } from '../lib/siteConfig'
import { logOut } from '../app/lib/authHelper'
import { useAuth } from '../app/context/AuthContext'
import { useNotifications } from '../app/lib/useNotifications'

function getDisplayName(user, profile) {
  if (profile?.fullName && profile.fullName.trim()) return profile.fullName
  if (!user) return ''
  if (user.displayName && user.displayName.trim()) return user.displayName
  if (user.email) return user.email.split('@')[0]
  return 'Account'
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfileMenu({ user, profile, compact = false }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const name = getDisplayName(user, profile)
  const initials = getInitials(name)

  const handleLogout = async () => {
    setOpen(false)
    try {
      await logOut()
    } finally {
      router.replace('/login')
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account menu — ${name}`}
          className="focus-visible-ring flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-semibold text-white shadow-sm shadow-black/10 transition-all duration-200 hover:scale-[1.04]"
        >
          {initials}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex cursor-pointer items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2 transition-colors hover:bg-white/5"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6] text-[9px] font-semibold text-white">
            {initials}
          </div>

          <span className="text-[11px] font-medium text-[var(--foreground)]">
            {name}
          </span>

          <svg
            width="11"
            height="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            className={`text-[var(--muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--background)] shadow-lg"
        >
          <div className="border-b border-[var(--border)] px-3 py-2.5">
            <p className="truncate text-[11px] font-semibold text-[var(--foreground)]">
              {name}
            </p>
            {user?.email && (
              <p className="truncate text-[10px] text-[var(--muted)]">
                {user.email}
              </p>
            )}
          </div>

          <Link
            href="/dashboard?tab=settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-medium text-[var(--foreground)] transition-colors hover:bg-white/5"
          >
            <svg
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              className="text-[var(--muted)]"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-[var(--border)] px-3 py-2.5 text-left text-[11px] font-medium text-[var(--foreground)] transition-colors hover:bg-white/5"
          >
            <svg
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              className="text-[var(--muted)]"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const wrapperRef = useRef(null)

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          unreadCount > 0
            ? `Notifications — ${unreadCount} unread`
            : 'Notifications'
        }
        className="relative flex h-7 w-7 items-center justify-center rounded-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]"
      >
        <svg
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-semibold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { user, userProfile } = useAuth()

  const isDashboardPage =
    pathname.startsWith('/dashboard')

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'children', label: 'Children' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'reports', label: 'Reports' },
  ]

  return (
    <header className="sticky top-0 z-50 glass clarity-hero">

      {isDashboardPage ? (

         <div className=" flex items-center justify-between  bg-[var(--background)] px-4 py-3 sm:px-6 lg:px-8">

        {/* Left */}
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span className="text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
              Guardiané
            </span>
          </Link>

        </div>


        {/* Right */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Search */}
          <button className="flex h-7 w-7 items-center justify-center rounded-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Notifications */}
          <NotificationsBell />

          {/* Profile dropdown */}
          <ProfileMenu user={user} profile={userProfile} />
        </div>
      </div>

      ) : (

        /* ── NORMAL MARKETING HEADER ── */
        <nav className="clarity-wrap flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-10">
            <ul className="hidden items-center gap-7 lg:flex">
              {mainNavLinks.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group relative text-[0.82rem] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]"
                  >
                    {label}

                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--foreground)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2.5 font-sans">
            <ThemeToggle />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="focus-visible-ring group inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-transparent px-5 py-2 text-[0.78rem] font-medium text-[var(--foreground)] transition-all duration-200 hover:border-[var(--foreground)]/30 hover:bg-white/5"
                >
                  Dashboard
                  <span
                    aria-hidden
                    className="text-[var(--muted)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--foreground)]"
                  >
                    ↗
                  </span>
                </Link>
                <ProfileMenu user={user} profile={userProfile} compact />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="focus-visible-ring rounded-full px-4 py-2 text-[0.78rem] font-medium text-[var(--muted)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--foreground)]"
                >
                  Login
                </Link>

                <Link
                  href="/signup"
                  className="focus-visible-ring rounded-full bg-[var(--background)] px-5 py-2 text-[0.78rem] font-semibold text-[var(--background)] shadow-sm shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
                >
                  Sign up today
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
