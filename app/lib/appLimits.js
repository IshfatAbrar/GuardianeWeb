// Parent-set app time limits — the web half of the app-blocking feature.
//
// Written to the child's own `users/{childId}` doc under `parentAppLimits`,
// a map of packageName -> { minutes, appName }. The child app
// (Guardiane_Android) has a matching ParentAppLimitsService that pulls this
// field on its normal monitoring-sync cadence, caches it, and
// LessonRewardService.getEffectiveLimits() folds it into whatever the child
// set for themselves — taking the STRICTER of the two — before pushing the
// enforced value to the on-device accessibility blocker.
//
// This only works because the schema tolerates additive fields: the child
// app ignores keys it doesn't recognize, so writing this here can't corrupt
// anything the Android apps read (see the migration notes in database.js).
//
// A limit set here is not instant — it lands the next time the child's
// device runs its throttled monitoring sync (every few minutes while the app
// is open/foregrounded, or immediately if the child opens their own App Time
// Limits screen). There is no push channel to a child device in this schema.

import { doc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from './firebase'
import { COLLECTIONS } from './database'

/** Set (or replace) a parent-side limit for one app on one child. */
export async function setParentAppLimit(childId, packageName, minutes, appName) {
  if (!childId || !packageName) throw new Error('Missing childId or packageName')
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error('Minutes must be > 0')
  await updateDoc(doc(db, COLLECTIONS.USERS, childId), {
    [`parentAppLimits.${packageName}`]: { minutes: Math.round(minutes), appName: appName || packageName },
  })
}

/** Remove a parent-side limit for one app on one child. */
export async function removeParentAppLimit(childId, packageName) {
  if (!childId || !packageName) return
  await updateDoc(doc(db, COLLECTIONS.USERS, childId), {
    [`parentAppLimits.${packageName}`]: deleteField(),
  })
}
