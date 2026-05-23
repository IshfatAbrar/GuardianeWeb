'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../app/context/AuthContext'

/**
 * AuthGuard
 *
 * mode="protected" — page requires a signed-in user.
 *   If signed out, redirect to /login. While Firebase resolves
 *   the persisted session, render `fallback` (defaults to null)
 *   so signed-out content never flashes.
 *
 * mode="public" — page is for signed-out visitors (home, login, signup).
 *   If a signed-in session is detected, redirect to /dashboard.
 *   Children render immediately; the redirect happens as soon as
 *   Firebase resolves the persisted session.
 */
export function AuthGuard({
  mode = 'protected',
  redirectTo,
  children,
  fallback = null,
}) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (mode === 'protected' && !user) {
      router.replace(redirectTo || '/login')
    } else if (mode === 'public' && user) {
      router.replace(redirectTo || '/dashboard')
    }
  }, [loading, user, mode, redirectTo, router])

  if (mode === 'protected' && (loading || !user)) {
    return fallback
  }
  // Public pages: don't flash the form while auth is still resolving, and
  // don't flash it when a signed-in user is about to be redirected away.
  if (mode === 'public' && (loading || user)) {
    return fallback
  }

  return children
}
