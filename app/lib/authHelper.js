// lib/authHelpers.js
//
// Thin wrappers around Firebase Auth. Most pages should prefer the AuthContext
// hook (`useAuth()`); these are kept for non-React contexts and for places that
// already imported them.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import { createUserProfile, getUserProfile } from './database'

/**
 * Sign in. Returns { user, profile } — the Firebase user and the matching
 * Firestore users/{uid} document.
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(credential.user.uid)
  console.log('[GUARDIANE-DB] authHelper.signIn → user:', credential.user.uid, 'profile:', profile)
  return { user: credential.user, profile }
}

/**
 * Create account. `extras` carries the fields we persist on the Firestore
 * users/{uid} document: { firstName, lastName, numChildren }.
 * Returns { user, profile }.
 */
export async function signUp(email, password, displayName, extras = {}) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }
  const { firstName = '', lastName = '', numChildren = 0 } = extras
  await createUserProfile(credential.user.uid, {
    email,
    displayName: displayName || '',
    firstName,
    lastName,
    role: 'parent',
    numChildren: Number(numChildren) || 0,
  })
  const profile = await getUserProfile(credential.user.uid)
  console.log('[GUARDIANE-DB] authHelper.signUp → user:', credential.user.uid, 'profile:', profile)
  return { user: credential.user, profile }
}

/** Sign out the current user */
export async function logOut() {
  await signOut(auth)
}

/** Send a password-reset email */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email)
}

/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function — call it on component unmount.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

/** Get the currently signed-in user (or null) */
export function currentUser() {
  return auth.currentUser
}
