// Server-only Firebase Admin, used to mint password-reset links so we can send
// our own branded email instead of Firebase's stock one.
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

export function getAdminAuth() {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!clientEmail || !privateKey || !projectId) return null;

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  return getAuth(app);
}
