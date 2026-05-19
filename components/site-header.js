'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ThemeToggle } from './theme-toggle'
import { mainNavLinks } from '../lib/siteConfig'

export function SiteHeader() {
  const pathname = usePathname()

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
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
              Guardiané
            </span>
          </div>
          
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
          <button className="relative flex h-7 w-7 items-center justify-center rounded-sm text-[var(--muted)] transition-colors hover:bg-white/5 hover:text-[var(--foreground)]">
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

            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {/* Profile */}
          {/* BLUE: Sign in primary button — bg #3b82f6 / hover #2563eb */}
          <div className="flex cursor-pointer items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--background)] px-3 py-2 transition-colors hover:bg-white/5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6] text-[9px] font-semibold text-[var(--background)]">
              S
            </div>

            <span className="text-[11px] font-medium text-[var(--foreground)]">
              Sarah J.
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
              className="text-[var(--muted)]"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
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

            <Link
              href="/login"
              className="focus-visible-ring rounded-full px-4 py-2 text-[0.78rem] font-medium text-[var(--muted)] transition-all duration-200 hover:bg-white/5 hover:text-[var(--foreground)]"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="focus-visible-ring rounded-full bg-white px-5 py-2 text-[0.78rem] font-semibold text-black shadow-sm shadow-black/10 transition-all duration-200 hover:scale-[1.02]"
            >
              Sign up today
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}