'use client'

// Lightweight, password-less identity for the public JoJo chatbot.
//
// This is intentionally NOT the main Firebase account flow (that one lives at
// /login + /signup and leads to the dashboard). A JoJo "user" is just contact
// info kept in the browser so a guest can keep chatting and so the team can
// invite them to the full product later. Sign-up additionally writes a lead to
// Firestore (best-effort — a failed write never blocks chatting). There is no
// password and no server session: "logging in" just restores the local identity
// from whatever email/phone the visitor types.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createJojoLead } from '../../lib/database'

const STORAGE_KEY = 'jojo_user_v1'

const JojoAuthContext = createContext({
  user: null,
  loading: true,
  signUp: async () => {},
  logIn: async () => {},
  logOut: () => {},
})

function readUser() {
  if (typeof window === 'undefined') return null
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeUser(user) {
  if (typeof window === 'undefined') return
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (e.g. private mode) — identity still held in state.
  }
}

// Trim + clamp the raw form into the stored identity shape.
function normalize(form = {}) {
  const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  return {
    name: clean(form.name, 100),
    email: clean(form.email, 254),
    phone: clean(form.phone, 32),
    childInfo: clean(form.childInfo, 500),
    zip: clean(form.zip, 20),
  }
}

// What to show in the top-bar button / menu header.
export function jojoDisplayName(user) {
  if (!user) return ''
  return user.name || user.email || user.phone || 'Guest'
}

export function JojoAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Hydrate from localStorage after mount (reading storage during render would
  // mismatch the storage-less server render).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setUser(readUser())
    setLoading(false)
  }, [])

  const persist = useCallback((next) => {
    setUser(next)
    writeUser(next)
  }, [])

  const signUp = useCallback(
    async (form) => {
      const u = normalize(form)
      if (!u.email && !u.phone) {
        throw new Error('Please enter an email address or phone number.')
      }
      // Lead capture is best-effort: if the Firestore write fails (rules not yet
      // deployed, offline, etc.) we still sign the guest in locally so they can
      // keep chatting without friction.
      try {
        await createJojoLead(u)
      } catch (err) {
        console.warn('JoJo lead write failed (continuing anyway):', err)
      }
      persist(u)
      return u
    },
    [persist],
  )

  const logIn = useCallback(
    async (form) => {
      const u = normalize(form)
      if (!u.email && !u.phone) {
        throw new Error('Please enter an email address or phone number.')
      }
      // No password / no verification — restore the local identity from input.
      persist(u)
      return u
    },
    [persist],
  )

  const logOut = useCallback(() => persist(null), [persist])

  return (
    <JojoAuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </JojoAuthContext.Provider>
  )
}

export function useJojoAuth() {
  return useContext(JojoAuthContext)
}
