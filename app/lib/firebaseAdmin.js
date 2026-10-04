// Server-only Firebase Admin: mints password-reset / verification links for our
// branded emails, and reads/writes the Admin-only `screen_time_unlocks`
// collection (see screenTimeUnlock.js).
//
// Needs a service-account key (Firebase console → Project settings → Service
// accounts → Generate new private key). Never import this from client code.
//
//   FIREBASE_ADMIN_CLIENT_EMAIL   the key's client_email
//   FIREBASE_ADMIN_PRIVATE_KEY    the key's private_key (literal "\n" is fine)
//
// When either is missing, `getAdminAuth()` returns null and callers fall back to
// the client SDK's built-in reset email — the app keeps working unconfigured.

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  // Hosting dashboards often keep the quotes from a pasted .env line, which
  // makes cert() throw — strip them along with escaped newlines.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!clientEmail || !privateKey || !projectId) return null;

  try {
    return (
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    );
  } catch (e) {
    // A malformed key must not 500 every caller; treat it as unconfigured.
    console.error("[firebaseAdmin] init failed:", e?.message);
    return null;
  }
}

export function getAdminAuth() {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

/** Admin Firestore (bypasses security rules), or null when unconfigured. */
export function getAdminFirestore() {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
