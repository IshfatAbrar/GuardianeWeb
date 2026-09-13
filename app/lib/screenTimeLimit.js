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
import { db } from "./firebase";
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
