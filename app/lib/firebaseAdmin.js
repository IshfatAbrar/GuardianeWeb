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
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!clientEmail || !privateKey || !projectId) return null;

  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    })
  );
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
