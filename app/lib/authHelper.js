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
import {
  provisionParentAndFamily,
  rollbackFamilyProvision,
  getUserProfile,
} from './database'

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
 * Create account. Matches the live iOS Firestore schema enforced by security
 * rules: writes `users/{uid}` (parent profile), `families/{auto}` (family doc),
 * and one `children/{auto}` per child, then links familyId and childIds back.
 * `extras` shape: { children: [{ name, bday, gender, grade }] }
 * Returns { user, profile, familyId, childIds }.
 */
export async function signUp(email, password, displayName, extras = {}) {
  const fullName = (displayName || '').trim()
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const uid = credential.user.uid

  if (fullName) {
    await updateProfile(credential.user, { displayName: fullName })
  }

  const { children = [] } = extras
  let familyId = null
  try {
    const result = await provisionParentAndFamily({
      uid,
      email,
      fullName,
      children,
    })
    familyId = result.familyId
    const profile = await getUserProfile(uid)
    return { user: credential.user, profile, familyId, childIds: result.childIds }
  } catch (err) {
    // Best-effort cleanup: family doc (deletable), then Auth user (frees email).
    // users/{uid} cannot be deleted by rule — orphaned but unreadable.
    if (familyId) await rollbackFamilyProvision(familyId)
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
