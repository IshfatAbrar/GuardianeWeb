
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
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Collection name constants ────────────────────────────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  FAMILIES: 'families',
  CHILDREN: 'children',
  ALERTS: 'alerts',
  ASSIGNMENTS: 'assignments',
  MOOD_ENTRIES: 'moodEntries',
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
}

/** Patch a user profile document. */
export async function updateUserProfile(uid, patch) {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
}

/** Fetch a single user profile. Returns null if the doc doesn't exist. */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Generate the registration QR code string for a child. Matches the iOS
 * format from OnboardingViewModel.generateChildQRCode:
 *   guardiane:{parentUid}:{kebab-name}:{4-char-uuid}
 */
export function generateChildQRCode(parentUid, childName) {
  const slug = String(childName || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
  let suffix
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    suffix = crypto.randomUUID().slice(0, 4)
  } else {
    suffix = Math.random().toString(16).slice(2, 6)
  }
  return `guardiane:${parentUid}:${slug}:${suffix}`
}

/**
 * Return every child profile linked to this parent (children where
 * parentIds array-contains uid). Backfills `qrCode` for any child missing it
 * — iOS auto-generates one at child creation, so this brings legacy/web-
 * created docs into parity.
 */
export async function getChildrenForParent(parentUid) {
  const q = query(
    collection(db, COLLECTIONS.CHILDREN),
    where('parentIds', 'array-contains', parentUid),
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

  // Backfill missing qrCode in the background — don't block the read.
  const needsBackfill = rows.filter(
    (c) => typeof c.qrCode !== 'string' || c.qrCode.length === 0,
  )
  for (const child of needsBackfill) {
    const qrCode = generateChildQRCode(parentUid, child.name)
    child.qrCode = qrCode
    // Fire-and-forget; if rules deny the write we just won't have a QR yet.
    updateDoc(doc(db, COLLECTIONS.CHILDREN, child.id), {
      qrCode,
      updatedAt: serverTimestamp(),
    }).catch(() => {})
  }

  return rows
}

// Convert "YYYY-MM-DD" (HTML <input type="date">) to "MM/DD/YYYY" so the iOS
// app's existing string-based reads keep working.
function toBirthDateString(input) {
  if (!input) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (m) return `${m[2]}/${m[3]}/${m[1]}`
  return input
}

// Compute age in whole years from "YYYY-MM-DD". Rules require 0–18 ints.
function computeAge(yyyyMmDd) {
  if (!yyyyMmDd) return 0
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(yyyyMmDd)
  if (!m) return 0
  const dob = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(dob.getTime())) return 0
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age--
  return Math.max(0, Math.min(18, age))
}

/**
 * Provision a brand-new parent: writes users/{uid}, families/{auto}, one
 * children/{auto} per child, then links them via families.childIds and
 * users.familyId. Sequenced into two batches because the rules' `get()` on
 * the family doc only sees committed state — children create must happen
 * after the family is committed.
 *
 * Shapes match the iOS rule helpers (validUserData/validFamilyData/validChildData).
 * Returns { familyId, childIds }.
 */
export async function provisionParentAndFamily({ uid, email, fullName, children }) {
  const childrenArr = Array.isArray(children) ? children : []

  // ── Batch 1: parent profile + family doc ──────────────────────────────────
  const batch1 = writeBatch(db)

  const userRef = doc(db, COLLECTIONS.USERS, uid)
  batch1.set(userRef, {
    email,
    fullName,
    isActive: true,
    hasCompletedOnboarding: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const familyRef = doc(collection(db, COLLECTIONS.FAMILIES))
  const familyId = familyRef.id
  batch1.set(familyRef, {
    name: `${fullName}'s Family`,
    parentIds: [uid],
    childIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch1.commit()

  // ── Batch 2: child docs + link them back to family/user ───────────────────
  const batch2 = writeBatch(db)
  const childIds = []

  childrenArr.forEach((c) => {
    const childRef = doc(collection(db, COLLECTIONS.CHILDREN))
    childIds.push(childRef.id)
    batch2.set(childRef, {
      name: c.name,
      age: computeAge(c.bday),
      birthDate: toBirthDateString(c.bday),
      gender: c.gender || null,
      grade: c.grade || null,
      qrCode: generateChildQRCode(uid, c.name),
      familyId,
      parentIds: [uid],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  if (childIds.length > 0) {
    batch2.update(familyRef, {
      childIds,
      updatedAt: serverTimestamp(),
    })
  }

  batch2.update(userRef, {
    familyId,
    hasCompletedOnboarding: true,
    updatedAt: serverTimestamp(),
  })

  await batch2.commit()

  return { familyId, childIds }
}

/**
 * Best-effort cleanup if batch 2 failed but batch 1 succeeded.
 * Deletes the family doc (rules permit owner delete). The user doc cannot
 * be deleted (rules deny it); orphaned docs are unreadable to anyone else.
 */
export async function rollbackFamilyProvision(familyId) {
  if (!familyId) return
  try {
    await deleteDoc(doc(db, COLLECTIONS.FAMILIES, familyId))
  } catch (_) {}
}

// ─── Modules & learning progress ─────────────────────────────────────────────

/** Get every module document. */
export async function getModules() {
  const snap = await getDocs(collection(db, COLLECTIONS.MODULES))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ── Dashboard reads ──────────────────────────────────────────────────────────
// All scoped by single-equality where() to avoid needing composite indexes.
// Client-side filters/sorts handle the rest.

/** Alerts for a family. Returns newest first, optionally only active ones. */
export async function getAlertsForFamily(familyId, { activeOnly = false, max = 20 } = {}) {
  if (!familyId) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.ALERTS), where('familyId', '==', familyId)),
  )
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  if (activeOnly) rows = rows.filter((a) => a.status === 'active')
  rows.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
  return rows.slice(0, max)
}

/** Active assignments for a family. Matches iOS `getAssignments(familyId:)` —
 * filtered to isActive=true so soft-deleted rows are excluded. */
export async function getAssignmentsForFamily(familyId) {
  if (!familyId) return []
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.ASSIGNMENTS),
      where('familyId', '==', familyId),
      where('isActive', '==', true),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Most recent mood entry for a child, restricted to today (or null). */
export async function getTodaysMoodForChild(childId) {
  if (!childId) return null
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  rows.sort((a, b) => (b.timestamp?.toMillis?.() ?? 0) - (a.timestamp?.toMillis?.() ?? 0))
  const latest = rows[0]
  if (!latest?.timestamp?.toDate) return null
  const ts = latest.timestamp.toDate()
  const now = new Date()
  if (
    ts.getFullYear() === now.getFullYear() &&
    ts.getMonth() === now.getMonth() &&
    ts.getDate() === now.getDate()
  ) {
    return latest
  }
  return null
}

/** Get a single child's learning_progress documents. */
export async function getChildLearningProgress(childUid) {
  const q = query(
    collection(db, COLLECTIONS.LEARNING_PROGRESS),
    where('childId', '==', childUid),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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

  return { childUid, totalMinutes, byApp, entries }
}

/** Add one screen-time entry (typically called from the child device app). */
export async function addScreenTimeEntry(entry) {
  const ref = await addDoc(collection(db, COLLECTIONS.SCREEN_TIME_ENTRIES), {
    ...entry,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// ─── Emergency contacts ──────────────────────────────────────────────────────
// Stored as a sub-collection under users/{uid}/emergency_contacts.

/** Get a parent's emergency contacts. */
export async function getEmergencyContacts(parentUid) {
  const snap = await getDocs(
    collection(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Add an emergency contact to a parent profile. */
export async function addEmergencyContact(parentUid, contact) {
  const ref = await addDoc(
    collection(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS),
    { ...contact, createdAt: serverTimestamp() },
  )
  return ref.id
}

/** Remove an emergency contact. */
export async function deleteEmergencyContact(parentUid, contactId) {
  await deleteDoc(
    doc(db, COLLECTIONS.USERS, parentUid, COLLECTIONS.EMERGENCY_CONTACTS, contactId),
  )
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
    callback(data)
  })
}

// Suppress unused-warning for `limit` — kept exported-via-import in case
// downstream files want to extend queries without re-importing from firestore.
export { limit }
