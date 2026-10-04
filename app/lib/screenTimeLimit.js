// Parent-set daily Screen Time limit — the web half of the iOS screen-time
// feature (Guardiane_Kid_Facing/Managers/ScreenTimeManager.swift).
//
// Written to the child's own `users/{childId}` doc under the plain field
// `screenTimeLimitMinutes`. This is DIFFERENT from `parentAppLimits` (see
// appLimits.js), which is Android-only, per-app minutes. This field is a
// single whole-device number, because Apple's FamilyControls framework only
// exposes a threshold-crossing callback for whatever apps/categories the
// child selected on their own device — it can't target specific apps
// remotely (the selection itself is a set of opaque, device-local tokens
// that can't be created or transferred from the web). See that Swift file's
// header comment for the full architecture note.
//
// Same "not instant" caveat as app limits: iOS's ScreenTimeManager only
// re-reads this field when the child's app calls
// refreshLimitFromFirestore(childId:), which happens when the child opens
// their Screen Time screen or on whatever cadence the app already checks —
// there is no push channel to the child's device in this schema.

import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { COLLECTIONS } from "./database";

/** Set (or replace) the daily screen time limit, in minutes, for one child. */
export async function setScreenTimeLimit(childId, minutes) {
  if (!childId) throw new Error("Missing childId");
  if (!Number.isFinite(minutes) || minutes <= 0)
    throw new Error("Minutes must be > 0");
  await updateDoc(doc(db, COLLECTIONS.USERS, childId), {
    screenTimeLimitMinutes: Math.round(minutes),
  });
}

/**
 * Ask the server for a one-time code that unlocks the Screen Time settings on
 * this child's iPhone (see app/api/screen-time/unlock-code and
 * screenTimeUnlock.js). Returns { code, expiresAt: Date }.
 */
export async function requestScreenTimeUnlockCode(childId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  if (!childId) throw new Error("Missing childId");
  const token = await user.getIdToken();
  const res = await fetch("/api/screen-time/unlock-code", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ childId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.code) {
    throw new Error(body.error || "Couldn't create a code. Try again.");
  }
  return { code: body.code, expiresAt: new Date(body.expiresAt) };
}
