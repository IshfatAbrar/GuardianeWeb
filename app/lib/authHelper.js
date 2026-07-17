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
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from './firebase'
import { provisionParent, getUserProfile } from './database'

/**
 * Sign in. Returns { user, profile } — the Firebase user and the matching
 * Firestore users/{uid} document.
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(credential.user.uid)
  return { user: credential.user, profile }
}

/**
 * Create account. Writes the Android schema: `users/{uid}` with role 'parent',
 * plus one `users/{auto}` per child with role 'child' and a `parentId` back to
 * the parent. There is no family document in this schema.
 * `extras` shape: { children: [{ name, bday, gender, grade }], phone }
 * Returns { user, profile, childIds }.
 */
export async function signUp(email, password, displayName, extras = {}) {
  const fullName = (displayName || '').trim()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  if (fullName) {
    await updateProfile(credential.user, { displayName: fullName })
  }

  // Best-effort verification email. Nothing gates on it — neither this app nor
  // the Android parent app checks `emailVerified`, and the Android app never
  // sends one at all, so accounts made there are permanently unverified. Do not
  // start enforcing it here without fixing GuardParent first, or every
  // Android-created parent would be locked out of the web.
  try {
    await sendEmailVerification(credential.user)
  } catch (_) {}

  const { children = [], phone } = extras
  try {
    const result = await provisionParent({ uid, email, name: fullName, phone, children })
    const profile = await getUserProfile(uid)
    return { user: credential.user, profile, childIds: result.childIds }
  } catch (err) {
    // The provision is a single batch, so nothing partial survives a failure.
    // Drop the Auth user too, otherwise it squats on the email with no profile.
    try { await credential.user.delete() } catch (_) {}
    throw err
  }
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
