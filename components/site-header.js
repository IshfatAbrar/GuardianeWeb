'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { ThemeToggle } from './theme-toggle'
import { NotificationPanel } from './notification-panel'
import { mainNavLinks } from '../lib/siteConfig'
import { logOut } from '../app/lib/authHelper'
import { useAuth } from '../app/context/AuthContext'
import { useNotifications } from '../app/lib/useNotifications'
import { listenToChildrenForParent } from '../app/lib/database'
import { listenToEmergencyContacts } from '../app/lib/emergencyContacts'
import { getModulesByCategory, MODULE_CATEGORIES } from '../app/lib/learningModules'
import { sideNavItems, sideHighlightItems } from '../app/dashboard/data/nav'

function getDisplayName(user, profile) {
  if (profile?.name && profile.name.trim()) return profile.name
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

function NavDropdown({ label, items }) {
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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group inline-flex cursor-pointer items-center gap-1 text-[0.82rem] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]"
      >
        {label}
        <svg
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-3 w-48 -translate-x-1/2 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--background)] shadow-lg"
        >
          {items.map(([itemLabel, href]) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2.5 text-[0.8rem] font-medium text-[var(--foreground)] transition-colors hover:bg-white/5"
            >
              {itemLabel}
            </Link>
          ))}
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

// Dashboard-wide entries this search can jump to, beyond children: every
// sidebar destination (nav.js is the source of truth for id/label, so this
// can't drift out of sync with what the sidebar itself shows).
const SEARCHABLE_PAGES = [...sideHighlightItems, ...sideNavItems].map((item) => ({
  id: item.id,
  label: item.label,
}))

function matchesQuery(text, q) {
  return typeof text === 'string' && text.toLowerCase().includes(q)
}

// Global search over the dashboard — pages (sidebar destinations), children,
// learning modules, and emergency contacts. Click the icon and it extends
// into an inline search box right there in the header (no popover jumping
// out from under a small button); results drop down beneath it.
//
// Selecting a result never does its own client-side routing logic beyond
// building the URL — every jump (`?tab=`, `?child=`, `?module=`) is read back
// by DashboardContent (app/dashboard/page.js) through the same one-way
// URL→state sync pattern already used for `?tab=`, so picking a result from
// here behaves exactly like the equivalent sidebar click would.
function HeaderDashboardSearch({ userId }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [children, setChildren] = useState([])
  const [modules, setModules] = useState([])
  const [contacts, setContacts] = useState([])
  // Modules change rarely, so fetch them at most once — cached in this ref
  // across opens/closes rather than a state flag, so reopening the search
  // doesn't refetch a list that can't have changed.
  const modulesFetchedRef = useRef(false)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!userId) return undefined
    return listenToChildrenForParent(userId, setChildren)
  }, [userId])

  // Modules and contacts are only loaded once the search is actually opened,
  // not on every dashboard page load.
  useEffect(() => {
    if (!open || !userId || modulesFetchedRef.current) return undefined
    modulesFetchedRef.current = true
    let cancelled = false
    Promise.all([
      getModulesByCategory(MODULE_CATEGORIES.PARENT),
      getModulesByCategory(MODULE_CATEGORIES.CHILD),
    ])
      .then(([parentModules, childModules]) => {
        if (!cancelled) setModules([...parentModules, ...childModules])
      })
      .catch(() => {
        modulesFetchedRef.current = false
      })
    return () => {
      cancelled = true
    }
  }, [open, userId])

  useEffect(() => {
    if (!open || !userId) return undefined
    return listenToEmergencyContacts(userId, setContacts)
  }, [open, userId])

  function close() {
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!open) return undefined
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) close()
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const trimmed = query.trim().toLowerCase()
  // Empty query: a short set of quick links (pages + children) rather than
  // every module/contact dumped at once. Non-empty: real filtered results
  // across all four sources.
  const pageResults = SEARCHABLE_PAGES.filter(
    (p) => !trimmed || matchesQuery(p.label, trimmed),
  ).slice(0, trimmed ? 4 : 3)
  const childResults = children
    .filter((c) => !trimmed || matchesQuery(c.name, trimmed))
    .slice(0, trimmed ? 5 : 3)
  const moduleResults = trimmed
    ? modules.filter((m) => matchesQuery(m.title, trimmed)).slice(0, 5)
    : []
  const contactResults = trimmed
    ? contacts.filter((c) => matchesQuery(c.name, trimmed)).slice(0, 5)
    : []
  const totalResults =
    pageResults.length + childResults.length + moduleResults.length + contactResults.length

  function goToPage(id) {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', id)
    router.push(`/dashboard?${params.toString()}`)
    close()
  }

  function goToChild(childId) {
    const params = new URLSearchParams(window.location.search)
    params.set('child', childId)
    router.push(`/dashboard?${params.toString()}`)
    close()
  }

  function goToModule(moduleId) {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', 'learning')
    params.set('module', moduleId)
    router.push(`/dashboard?${params.toString()}`)
    close()
  }

  function goToContacts() {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', 'emergency')
    router.push(`/dashboard?${params.toString()}`)
    close()
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`flex items-center rounded-full border transition-colors duration-200 ${
          open ? 'border-[var(--border)] bg-[var(--surface-muted)] pr-2 py-1' : 'border-transparent'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Search dashboard"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]"
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
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search dashboard…"
          aria-label="Search dashboard"
          tabIndex={open ? 0 : -1}
          className={`bg-transparent text-[12px] text-[var(--foreground)] outline-none transition-all duration-200 ${
            open ? 'w-40 opacity-100 sm:w-56' : 'w-0 opacity-0'
          }`}
        />
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Search dashboard results"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--background)] shadow-lg"
        >
          <div className="max-h-80 overflow-y-auto py-1">
            {totalResults === 0 ? (
              <p className="px-3 py-2.5 text-[11.5px] text-[var(--muted)]">
                No matches.
              </p>
            ) : (
              <>
                {pageResults.length > 0 && (
                  <SearchSection label="Pages">
                    {pageResults.map((page) => (
                      <SearchResultRow
                        key={page.id}
                        label={page.label}
                        onClick={() => goToPage(page.id)}
                      />
                    ))}
                  </SearchSection>
                )}
                {childResults.length > 0 && (
                  <SearchSection label="Children">
                    {childResults.map((child) => (
                      <SearchResultRow
                        key={child.id}
                        label={child.name || 'Child'}
                        avatarText={getInitials(child.name)}
                        onClick={() => goToChild(child.id)}
                      />
                    ))}
                  </SearchSection>
                )}
                {moduleResults.length > 0 && (
                  <SearchSection label="Learning modules">
                    {moduleResults.map((mod) => (
                      <SearchResultRow
                        key={mod.id}
                        label={mod.title || 'Module'}
                        onClick={() => goToModule(mod.id)}
                      />
                    ))}
                  </SearchSection>
                )}
                {contactResults.length > 0 && (
                  <SearchSection label="Emergency contacts">
                    {contactResults.map((contact) => (
                      <SearchResultRow
                        key={contact.id}
                        label={contact.name || 'Contact'}
                        sublabel={contact.relationship}
                        onClick={goToContacts}
                      />
                    ))}
                  </SearchSection>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchSection({ label, children }) {
  return (
    <div className="py-1">
      <p className="px-3 pb-1 pt-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </p>
      {children}
    </div>
  )
}

function SearchResultRow({ label, sublabel, avatarText, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
    >
      {avatarText && (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[9px] font-semibold text-[var(--muted)]">
          {avatarText}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[var(--foreground)]">
        {label}
        {sublabel && (
          <span className="ml-1.5 font-normal text-[var(--muted)]">{sublabel}</span>
        )}
      </span>
    </button>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { user, userProfile } = useAuth()

  // The JoJo beta chat and its /login and /signup sub-routes are all
  // chrome-free — a focused, minimal experience is the point there.
  const isChatbotPage =
    pathname === '/chatbot' || pathname.startsWith('/chatbot/')

  const isDashboardPage =
    pathname.startsWith('/dashboard')

  // TEMP: dark mode disabled on the marketing site — force light theme
  // there while leaving the dashboard's own toggle untouched.
  useEffect(() => {
    if (isChatbotPage) return
    if (isDashboardPage) {
      const stored = window.localStorage.getItem('theme')
      document.documentElement.setAttribute(
        'data-theme',
        stored === 'dark' ? 'dark' : 'light',
      )
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [isChatbotPage, isDashboardPage])

  if (isChatbotPage) return null

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'children', label: 'Children' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'reports', label: 'Reports' },
  ]

  return (
    <header
      className={`sticky top-0 z-50 glass ${
        isDashboardPage ? "border-b border-[var(--border)]" : "py-2 pt-3"
      }`}
    >

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
              Guardiané AI
            </span>
          </Link>

        </div>


        {/* Right */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Search */}
          <HeaderDashboardSearch userId={user?.uid} />

          {/* Notifications */}
          <NotificationsBell />

          {/* Profile dropdown */}
          <ProfileMenu user={user} profile={userProfile} />
        </div>
      </div>

      ) : (

        /* ── NORMAL MARKETING HEADER ── */
        <nav className="clarity-wrap grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">

          {/* Left: brand */}
          <Link
            href="/"
            className="focus-visible-ring flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/guardian-icon.png"
              alt=""
              width={26}
              height={30}
              className="brand-icon shrink-0"
              priority
            />
            <span className="hidden text-[15px] font-semibold tracking-tight text-[var(--foreground)] sm:inline">
              Guardiané AI
            </span>
          </Link>

          {/* Center: nav links */}
          <ul className="hidden items-center justify-center gap-7 lg:flex">
            {mainNavLinks.map((entry) =>
              entry.items ? (
                <li key={entry.label}>
                  <NavDropdown label={entry.label} items={entry.items} />
                </li>
              ) : (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="group relative inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-[var(--muted)] transition-colors duration-200 hover:text-[var(--foreground)]"
                  >
                    {entry.label}

                    {entry.badge && (
                      <span className="rounded-full border border-[var(--border)] bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase leading-none tracking-wide text-[var(--muted)] transition-colors duration-200 group-hover:border-[var(--foreground)]/30 group-hover:text-[var(--foreground)]">
                        {entry.badge}
                      </span>
                    )}

                    <span className="absolute -bottom-1 left-0 h-px w-0 bg-[var(--foreground)] transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ),
            )}
          </ul>

          {/* Right: auth actions */}
          <div className="flex items-center justify-end gap-2.5 font-sans">
            {/* TEMP: dark mode disabled on the marketing site */}
            <ThemeToggle disabled />

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
