'use client'

// context/AuthContext.js
//
// Web parallel to the iOS AuthContext. Wraps the React tree in a provider that
// owns:
//   • the Firebase Auth user (or null)
//   • the matching Firestore profile from users/{uid}
//   • a `loading` flag covering both the auth check and the profile fetch
//   • signIn / signUp / signOut wrappers that keep the Firestore profile in sync
//
// Components read it via the `useAuth()` hook.

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import {
  provisionParentAndFamily,
  rollbackFamilyProvision,
  getUserProfile,
  listenToDoc,
  COLLECTIONS,
} from '../lib/database'

const AuthContext = createContext({
  user: null,
  userProfile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Subscribe to Firebase auth state. When a user appears, also live-bind their
  // Firestore profile so any update (e.g. adding a child) flows in.
  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up the previous profile listener if any.
      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      if (!fbUser) {
        setUser(null)
        setUserProfile(null)
        setLoading(false)
        return
      }

      setUser(fbUser)

      // One-shot fetch first so we have data immediately, then attach a live
      // listener for subsequent updates.
      const initial = await getUserProfile(fbUser.uid)
      setUserProfile(initial)

      unsubProfile = listenToDoc(`${COLLECTIONS.USERS}/${fbUser.uid}`, (data) => {
        setUserProfile(data)
      })

      setLoading(false)
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  const signUp = useCallback(
    async (email, password, { fullName, firstName, lastName, children = [] } = {}) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      const displayName = (fullName || [firstName, lastName].filter(Boolean).join(' ')).trim()
      if (displayName) {
        await updateProfile(cred.user, { displayName })
      }
      let familyId = null
      try {
        const result = await provisionParentAndFamily({
          uid: cred.user.uid,
          email,
          fullName: displayName,
          children,
        })
        familyId = result.familyId
        return cred.user
      } catch (err) {
        if (familyId) await rollbackFamilyProvision(familyId)
        try { await cred.user.delete() } catch (_) {}
        throw err
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await fbSignOut(auth)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return null
    const data = await getUserProfile(user.uid)
    setUserProfile(data)
    return data
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, userProfile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

