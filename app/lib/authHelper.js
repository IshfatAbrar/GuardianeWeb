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
} from "firebase/auth";
import { auth } from "./firebase";
import { provisionParent, getUserProfile } from "./database";
import { isVerified } from "./emailVerification";

/**
 * Send the email-verification message: our branded template via
 * /api/send-verification when the server is set up for it, otherwise Firebase's
 * built-in email. The two never both send — the server answers "sent" (or
 * "already") only when it took care of it, and "firebase" means "you do it".
 */
export async function sendVerificationEmail(user) {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/send-verification", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { delivery } = await res.json();
      if (delivery === "sent" || delivery === "already") return;
    }
  } catch (_) {
    // Offline / route unreachable — fall through to Firebase's own email.
  }
  await sendEmailVerification(user);
}

/**
 * Sign in. Returns { user, profile } — the Firebase user and the matching
 * Firestore users/{uid} document.
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (!isVerified(credential.user)) {
    // Blocked until verified. Re-send a fresh link (best-effort — the server
    // throttles, and Firebase may rate-limit its own fallback), then drop the
    // session so an unverified account never lingers signed in.
    try {
      await sendVerificationEmail(credential.user);
    } catch (_) {}
    await signOut(auth);
    throw Object.assign(new Error("Email not verified."), {
      code: "auth/email-not-verified",
    });
  }
  const profile = await getUserProfile(credential.user.uid);
  return { user: credential.user, profile };
}

/**
 * Create account. Writes the Android schema: `users/{uid}` with role 'parent',
 * plus one `users/{auto}` per child with role 'child' and a `parentId` back to
 * the parent. There is no family document in this schema.
 * `extras` shape: { children: [{ name, bday, gender, grade }], phone }
 * Returns { user, profile, childIds, needsVerification } — when true the session
 * has been ended and the parent must verify their email, then sign in.
 */
export async function signUp(email, password, displayName, extras = {}) {
  const fullName = (displayName || "").trim();
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const uid = credential.user.uid;

  if (fullName) {
    await updateProfile(credential.user, { displayName: fullName });
  }

  // Best-effort verification email. Sign-in and AuthContext enforce
  // `emailVerified` (see ./emailVerification.js), so this link is how a new
  // parent gets in. Android-created parents are unverified until GuardParent
  // sends the email too — until then they are blocked here and sent a fresh link.
  try {
    await sendVerificationEmail(credential.user);
  } catch (_) {}

  const { children = [], phone } = extras;
  try {
    const result = await provisionParent({
      uid,
      email,
      name: fullName,
      phone,
      children,
    });
    const profile = await getUserProfile(uid);
    // Unverified parents must verify before using the portal: end the session
    // now (the profile is already written) rather than leave them signed in.
    const needsVerification = !isVerified(credential.user);
    if (needsVerification) await signOut(auth);
    return {
      user: credential.user,
      profile,
      childIds: result.childIds,
      needsVerification,
    };
  } catch (err) {
    // The provision is a single batch, so nothing partial survives a failure.
    // Drop the Auth user too, otherwise it squats on the email with no profile.
    try {
      await credential.user.delete();
    } catch (_) {}
    throw err;
  }
}

/** Sign out the current user */
export async function logOut() {
  await signOut(auth);
}

/** Send a password-reset email */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function — call it on component unmount.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/** Get the currently signed-in user (or null) */
export function currentUser() {
  return auth.currentUser;
}
