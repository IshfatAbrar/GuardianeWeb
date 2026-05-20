// lib/authHelpers.js
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './firebase'

/** Sign in — returns the Firebase user credential */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/** Create account — returns the new Firebase user */
export async function signUp(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
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
 *
 * Usage:
 *   const unsub = onAuthChange((user) => { ... })
 *   return () => unsub()
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}

/** Get the currently signed-in user (or null) */
export function currentUser() {
  return auth.currentUser
}