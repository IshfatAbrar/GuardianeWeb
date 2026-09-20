// Email-verification policy for the parent web app — mirrors the iOS parent app
// (`skipEmailVerificationForTesting` in AuthViewModel.swift).
//
// A parent must have a verified email to use the portal. The gate is client-side
// (AuthContext + signIn), same as iOS: Firestore rules do not check it.

/**
 * TEMPORARY test accounts that skip verification. Delete before launch — anyone
 * who registers one of these addresses first would bypass the gate.
 */
export const VERIFICATION_EXEMPT_EMAILS = ["test@gmail.com"];

/** True when `user` (a Firebase Auth user) may use the portal. */
export function isVerified(user) {
  if (!user) return false;
  if (user.emailVerified) return true;
  return VERIFICATION_EXEMPT_EMAILS.includes(
    (user.email || "").trim().toLowerCase(),
  );
}
