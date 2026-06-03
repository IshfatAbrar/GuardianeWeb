
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'

export const COLLECTIONS = {
  USERS: 'users',
  FAMILIES: 'families',
  CHILDREN: 'children',
  ALERTS: 'alerts',
  ASSIGNMENTS: 'assignments',
  MOOD_ENTRIES: 'moodEntries',
  MODULES: 'modules',
  LEARNING_PROGRESS: 'learning_progress',
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
 * Add a child to the parent's existing family. Mirrors iOS
 * `OnboardingViewModel.saveChild` for the create path: writes to
 * `children`, appends the id to `families.childIds`, and sets the QR code.
 * Returns the new child id.
 */
export async function createChild({ parentUid, familyId, name, bday, gender, grade }) {
  if (!parentUid || !familyId) throw new Error('Missing parentUid or familyId')
  if (!name) throw new Error('Child name is required')

  const childRef = doc(collection(db, COLLECTIONS.CHILDREN))
  await setDoc(childRef, {
    name: name.trim(),
    age: computeAge(bday),
    birthDate: toBirthDateString(bday),
    gender: gender || null,
    grade: grade || null,
    qrCode: generateChildQRCode(parentUid, name),
    familyId,
    parentIds: [parentUid],
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, COLLECTIONS.FAMILIES, familyId), {
    childIds: arrayUnion(childRef.id),
    updatedAt: serverTimestamp(),
  })
  return childRef.id
}

/** Patch a child document. */
export async function updateChild(childId, patch) {
  await updateDoc(doc(db, COLLECTIONS.CHILDREN, childId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Write the app-restriction policy onto a child document. Mirrors the iOS
 * `Child` model fields `blockedApps: [String]` and `screenTimeLimit: Int`,
 * which the child's device app reads to enforce restrictions (the web can't
 * enforce locally the way iOS ManagedSettings does).
 *   blockedApps      — array of app ids from lib/apps.js
 *   screenTimeLimit  — daily limit in minutes (0 = no limit)
 */
export async function updateChildRestrictions(childId, { blockedApps, screenTimeLimit }) {
  if (!childId) throw new Error('Missing childId')
  const patch = { updatedAt: serverTimestamp() }
  if (Array.isArray(blockedApps)) patch.blockedApps = blockedApps
  if (typeof screenTimeLimit === 'number') patch.screenTimeLimit = screenTimeLimit
  await updateDoc(doc(db, COLLECTIONS.CHILDREN, childId), patch)
}

/** Delete a child: remove the doc and unlink from family. */
export async function deleteChild(childId, familyId) {
  if (familyId) {
    await updateDoc(doc(db, COLLECTIONS.FAMILIES, familyId), {
      childIds: arrayRemove(childId),
      updatedAt: serverTimestamp(),
    }).catch(() => {})
  }
  await deleteDoc(doc(db, COLLECTIONS.CHILDREN, childId))
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

/**
 * Tear down a parent's data before the Firebase Auth user is deleted. The
 * security rules forbid hard-deleting user/child/mood docs (`delete: if false`)
 * — the schema is soft-delete via `isActive=false`. So this:
 *   • deactivates every child (the parent child-update rule allows it),
 *   • deletes the family doc (owner delete is permitted),
 *   • deactivates the parent profile (`isActive=false`; the doc itself can't
 *     be deleted).
 * Must run while the user is still authenticated. It is idempotent, so it's
 * safe to re-run if the subsequent auth deletion needs a fresh re-login.
 * Mood entries / alerts can't be purged from the client (rules) — a Cloud
 * Function with the Admin SDK is required to fully erase those.
 */
export async function softDeleteAccountData({ uid, familyId, children }) {
  const kids = Array.isArray(children) ? children : []
  await Promise.all(
    kids.map((c) =>
      updateDoc(doc(db, COLLECTIONS.CHILDREN, c.id), {
        isActive: false,
        updatedAt: serverTimestamp(),
      }).catch(() => {}),
    ),
  )
  if (familyId) {
    await deleteDoc(doc(db, COLLECTIONS.FAMILIES, familyId)).catch(() => {})
  }
  if (uid) {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
      isActive: false,
      updatedAt: serverTimestamp(),
    }).catch(() => {})
  }
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

/** All mood entries for a child whose timestamp falls inside [fromDate, toDate). */
export async function getMoodEntriesForChildInRange(childId, fromDate, toDate) {
  if (!childId || !(fromDate instanceof Date) || !(toDate instanceof Date)) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  const fromMs = fromDate.getTime()
  const toMs = toDate.getTime()
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const ms = r.timestamp?.toMillis?.()
      return typeof ms === 'number' && ms >= fromMs && ms < toMs
    })
  rows.sort((a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0))
  return rows
}

/**
 * All mood entries for a child within the last `days` (default 7), oldest
 * first. Mirrors iOS MoodViewModel.loadMoodEntries: fetch by childId, then
 * filter client-side by cutoff to avoid a composite index.
 */
export async function getMoodEntriesForChild(childId, days = 7) {
  if (!childId) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  const cutoff = Date.now() - days * 86_400_000
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const ms = r.timestamp?.toMillis?.()
      return typeof ms === 'number' && ms >= cutoff
    })
  rows.sort((a, b) => (a.timestamp?.toMillis?.() ?? 0) - (b.timestamp?.toMillis?.() ?? 0))
  return rows
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

/** Subscribe to a single Firestore document. Returns the unsubscribe function. */
export function listenToDoc(path, callback) {
  const ref = doc(db, ...path.split('/'))
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}
