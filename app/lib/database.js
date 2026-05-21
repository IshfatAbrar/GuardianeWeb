// lib/database.js
//
// Web parallel to the iOS DatabaseService. All Firestore access for the parent
// portal goes through this module so the app has one place to evolve schema,
// add caching, swap to admin SDK on the server, etc.
//
// Collections (mirrors iOS):
//   users               — parent and child profiles ({ role: 'parent' | 'child' })
//   modules             — learning modules
//   learning_progress   — per-child module progress
//   messages            — chat messages (parent ↔ child, parent ↔ counselor)
//   screen_time_entries — raw screen-time samples reported by the child device
//
// All "listen*" helpers return the Firestore unsubscribe function — caller is
// responsible for invoking it on unmount.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Collection name constants ────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  MODULES: 'modules',
  LEARNING_PROGRESS: 'learning_progress',
  MESSAGES: 'messages',
  SCREEN_TIME_ENTRIES: 'screen_time_entries',
  EMERGENCY_CONTACTS: 'emergency_contacts', // sub-collection under users/{uid}
}

// ─── Users ───────────────────────────────────────────────────────────────────

/** Create or overwrite a user profile document at users/{uid}. */
export async function createUserProfile(uid, data) {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  await setDoc(
    ref,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  console.log('[GUARDIANE-DB] createUserProfile →', uid, data)
}

/** Patch a user profile document. */
export async function updateUserProfile(uid, patch) {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
  console.log('[GUARDIANE-DB] updateUserProfile →', uid, patch)
}

/** Fetch a single user profile. Returns null if the doc doesn't exist. */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid))
  const data = snap.exists() ? { id: snap.id, ...snap.data() } : null
  console.log('[GUARDIANE-DB] getUserProfile ←', uid, data)
  return data
}

/** Return every child profile linked to this parent (users where parentId == uid). */
export async function getChildrenForParent(parentUid) {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('role', '==', 'child'),
    where('parentId', '==', parentUid),
  )
  const snap = await getDocs(q)
  const children = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log('[GUARDIANE-DB] getChildrenForParent ←', parentUid, children)
  return children
}

// ─── Modules & learning progress ─────────────────────────────────────────────

/** Get every module document. */
export async function getModules() {
  const snap = await getDocs(collection(db, COLLECTIONS.MODULES))
  const modules = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log('[GUARDIANE-DB] getModules ←', modules)
  return modules
}

/** Get a single child's learning_progress documents. */
export async function getChildLearningProgress(childUid) {
  const q = query(
    collection(db, COLLECTIONS.LEARNING_PROGRESS),
    where('childId', '==', childUid),
  )
  const snap = await getDocs(q)
  const progress = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log('[GUARDIANE-DB] getChildLearningProgress ←', childUid, progress)
  return progress
}

// ─── Messages (real-time) ────────────────────────────────────────────────────

/**
 * Subscribe to a conversation. `conversationId` is a deterministic id derived
 * from the two participants (mirrors the iOS implementation).
 * Returns the unsubscribe function.
 */
export function listenToMessages(conversationId, callback) {
  const q = query(
    collection(db, COLLECTIONS.MESSAGES),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
  )
  const unsub = onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    console.log('[GUARDIANE-DB] listenToMessages →', conversationId, messages)
    callback(messages)
  })
  return unsub
}

/** Send a message into a conversation. */
export async function sendMessage({ conversationId, senderId, recipientId, body }) {
  const ref = await addDoc(collection(db, COLLECTIONS.MESSAGES), {
    conversationId,
    senderId,
    recipientId,
    body,
    createdAt: serverTimestamp(),
  })
  console.log('[GUARDIANE-DB] sendMessage →', ref.id, { conversationId, senderId, recipientId })
  return ref.id
}

// ─── Screen time ─────────────────────────────────────────────────────────────

/**
 * Build a screen-time report for a single child between two dates.
 * Returns { totalMinutes, byApp: { [appName]: minutes }, entries }.
 */
export async function getChildScreenTimeReport(childUid, { from, to } = {}) {
  const constraints = [where('childId', '==', childUid)]
  if (from) constraints.push(where('startedAt', '>=', Timestamp.fromDate(from)))
  if (to) constraints.push(where('startedAt', '<=', Timestamp.fromDate(to)))
  constraints.push(orderBy('startedAt', 'desc'))

  const snap = await getDocs(query(collection(db, COLLECTIONS.SCREEN_TIME_ENTRIES), ...constraints))
  const entries = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  let totalMinutes = 0
  const byApp = {}
  for (const e of entries) {
    const mins = Number(e.durationMinutes) || 0
    totalMinutes += mins
    byApp[e.appName || 'unknown'] = (byApp[e.appName || 'unknown'] || 0) + mins
  }

  const report = { childUid, totalMinutes, byApp, entries }
  console.log('[GUARDIANE-DB] getChildScreenTimeReport ←', report)
  return report
}

/** Add one screen-time entry (typically called from the child device app). */
export async function addScreenTimeEntry(entry) {
  const ref = await addDoc(collection(db, COLLECTIONS.SCREEN_TIME_ENTRIES), {
    ...entry,
    createdAt: serverTimestamp(),
  })
  console.log('[GUARDIANE-DB] addScreenTimeEntry →', ref.id, entry)
  return ref.id
}

// ─── Emergency contacts ──────────────────────────────────────────────────────
// Stored as a sub-collection under users/{uid}/emergency_contacts.

/** Get a parent's emergency contacts. */
export async function getEmergencyContacts(parentUid) {
  const snap = await getDocs(
    collection(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS),
  )
  const contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log('[GUARDIANE-DB] getEmergencyContacts ←', parentUid, contacts)
  return contacts
}

/** Add an emergency contact to a parent profile. */
export async function addEmergencyContact(parentUid, contact) {
  const ref = await addDoc(
    collection(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS),
    { ...contact, createdAt: serverTimestamp() },
  )
  console.log('[GUARDIANE-DB] addEmergencyContact →', ref.id, contact)
  return ref.id
}

/** Remove an emergency contact. */
export async function deleteEmergencyContact(parentUid, contactId) {
  await deleteDoc(
    doc(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS, contactId),
  )
  console.log('[GUARDIANE-DB] deleteEmergencyContact →', parentUid, contactId)
}

// ─── Generic real-time helper ────────────────────────────────────────────────

/**
 * Subscribe to a single Firestore document. Returns the unsubscribe function.
 * Useful for live-binding the signed-in user's profile.
 */
export function listenToDoc(path, callback) {
  const ref = doc(db, ...path.split('/'))
  return onSnapshot(ref, (snap) => {
    const data = snap.exists() ? { id: snap.id, ...snap.data() } : null
    console.log('[GUARDIANE-DB] listenToDoc →', path, data)
    callback(data)
  })
}

// Suppress unused-warning for `limit` — kept exported-via-import in case
// downstream files want to extend queries without re-importing from firestore.
export { limit }
