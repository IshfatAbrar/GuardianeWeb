// Firestore data layer.
//
// SCHEMA CONTRACT — this file must match what the two Android apps read/write:
//   • GuardParent        (/Users/han/GuardParent)        — the Android parent app
//   • Guardiane_Android  (/Users/han/Guardiane_Android)  — the child's device app
// Both live in Firebase project `gurdiane-75091` (note the spelling:
// "gurdiane", no "a").
//
// The convention is deliberately mixed and easy to get wrong:
//   collection names are snake_case  (`mood_entries`, `screen_time_entries`)
//   field names are camelCase        (`childId`, `dateString`)
//
// Parents AND children are both documents in the single `users` collection,
// distinguished only by `role`. Children have no Firebase Auth account at all —
// the child device is unauthenticated and identifies itself by holding the
// child's document id (see the QR notes on childQrPayload below).

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
  MOOD_ENTRIES: 'mood_entries',
  SCREEN_TIME_ENTRIES: 'screen_time_entries',
  MODULES: 'modules',
  LEARNING_PROGRESS: 'learning_progress',
  JOJO_LEADS: 'jojoLeads',
}

// ─── JoJo guest leads ──────────────────────────────────────────────────────────

/**
 * Capture a guest's contact info from the public JoJo chatbot. This is NOT an
 * account — it's a lightweight lead so the team can follow up with an invite to
 * the full product. Either email or phone must be present; the rest is
 * optional. Empty optional fields are stored as "" to keep the doc shape stable.
 *
 * Returns the new lead document id.
 */
export async function createJojoLead({ email, phone, name, childInfo, zip } = {}) {
  const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const data = {
    email: clean(email, 254),
    phone: clean(phone, 32),
    name: clean(name, 100),
    childInfo: clean(childInfo, 500),
    zip: clean(zip, 20),
    source: 'chatbot',
    createdAt: serverTimestamp(),
  }
  if (!data.email && !data.phone) {
    throw new Error('Please enter an email address or phone number.')
  }
  const ref = doc(collection(db, COLLECTIONS.JOJO_LEADS))
  await setDoc(ref, data)
  return ref.id
}

// ─── Users (parents and children both live here) ─────────────────────────────

/** Create or overwrite a user profile document at users/{uid}. */
export async function createUserProfile(uid, data) {
  const ref = doc(db, COLLECTIONS.USERS, uid)
  await setDoc(
    ref,
    { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
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

// ─── Children ────────────────────────────────────────────────────────────────

/**
 * The QR payload the child app scans to pair a device.
 *
 * It is the child's raw Firestore document id — nothing else. No prefix, no
 * JSON, no expiry. Guardiane_Android's LoginScreen.onQRCodeRead passes the
 * scanned string straight to `doc(db, 'users', <scanned>)` and only checks that
 * the doc exists and its `role` is not something other than 'child'. Anything
 * fancier (e.g. the old web `guardiane:<parent>:<slug>:<id>` format, which the
 * SwiftUI kid app wanted) is rejected as "No user found for this ID".
 *
 * GuardParent renders exactly this, via `<QRCode value={child.id} />`.
 *
 * SECURITY NOTE: because the payload is just the document id and the child app
 * is unauthenticated, anyone who learns a child's id can pair as that child.
 * That is the Android apps' existing design; the web only mirrors it.
 */
export function childQrPayload(child) {
  return typeof child?.id === 'string' ? child.id : ''
}

/**
 * Every child linked to this parent.
 *
 * The canonical link is `parentId` + `role`, matching GuardParent's
 * `getChildrenByParentId`. The parent's `linkedChildren` array is a
 * denormalized cache that GuardParent overwrites (rather than appends) whenever
 * a child is added, so it silently drops earlier children — never read it.
 *
 * Two equality filters need no composite index; Firestore merges single-field
 * indexes. Sorted by `childIndex` to match GuardParent's ordering.
 */
export async function getChildrenForParent(parentUid) {
  if (!parentUid) return []
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where('parentId', '==', parentUid),
    where('role', '==', 'child'),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.childIndex ?? 0) - (b.childIndex ?? 0))
}

// Convert "YYYY-MM-DD" (HTML <input type="date">) to the "MM/DD/YYYY" string
// GuardParent writes and reads. Android stores this as a plain string, not a
// Timestamp, so it must round-trip verbatim.
function toBirthDateString(input) {
  if (!input) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  return m ? `${m[2]}/${m[3]}/${m[1]}` : input
}

/**
 * Whole years since an "MM/DD/YYYY" birthDate string, or null if unparseable.
 * Children created in GuardParent carry no `age` field — only this string — so
 * anything showing an age has to derive it.
 */
export function ageFromBirthDate(birthDate) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(birthDate ?? ''))
  if (!m) return null
  const dob = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDelta = now.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age--
  return age >= 0 && age <= 120 ? age : null
}

/** Build a child document in GuardParent's exact shape. */
function buildChildDoc({ parentUid, name, bday, gender, grade, notes, childIndex }) {
  return {
    parentId: parentUid,
    name: (name || '').trim(),
    birthDate: toBirthDateString(bday),
    gender: gender || '',
    notes: notes || '',
    // `grade` has no counterpart in the Android apps — they ignore unknown
    // fields, so keeping it is additive and safe for the web's own form.
    grade: grade || '',
    role: 'child',
    childIndex,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Provision a brand-new parent account: writes users/{uid} with role 'parent'
 * and one users/{auto} per child with role 'child'.
 *
 * Shape mirrors GuardParent's `createParentUser` + `createChildren`. There is no
 * `families` collection in this schema — the parent↔child link is the child's
 * `parentId` field alone.
 *
 * Single batch: `gurdiane-75091` has no rules that `get()` a sibling doc
 * mid-write, so nothing needs sequencing.
 * Returns { childIds }.
 */
export async function provisionParent({ uid, email, name, phone, children }) {
  const childrenArr = Array.isArray(children) ? children : []
  const batch = writeBatch(db)

  const userRef = doc(db, COLLECTIONS.USERS, uid)
  const childIds = []

  childrenArr.forEach((c, i) => {
    const childRef = doc(collection(db, COLLECTIONS.USERS))
    childIds.push(childRef.id)
    batch.set(
      childRef,
      buildChildDoc({
        parentUid: uid,
        name: c.name,
        bday: c.bday,
        gender: c.gender,
        grade: c.grade,
        notes: c.notes,
        childIndex: i + 1,
      }),
    )
  })

  batch.set(userRef, {
    uid,
    name: name || '',
    email,
    phone: phone || '',
    role: 'parent',
    numberOfChildren: childrenArr.length,
    linkedChildren: childIds,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
  return { childIds }
}

/**
 * Add a child to an existing parent. `childIndex` continues from the parent's
 * current child count so GuardParent's ordering stays sensible.
 *
 * Unlike GuardParent (which overwrites `linkedChildren` with a one-element
 * array and thereby drops previously linked children), this appends with
 * arrayUnion. Nothing reads the field, but leaving correct data is cheap.
 *
 * Returns the new child id.
 */
export async function createChild({ parentUid, name, bday, gender, grade, notes }) {
  if (!parentUid) throw new Error('Missing parentUid')
  if (!name) throw new Error('Child name is required')

  const existing = await getChildrenForParent(parentUid)
  const childRef = doc(collection(db, COLLECTIONS.USERS))
  await setDoc(
    childRef,
    buildChildDoc({
      parentUid,
      name,
      bday,
      gender,
      grade,
      notes,
      childIndex: existing.length + 1,
    }),
  )
  await updateDoc(doc(db, COLLECTIONS.USERS, parentUid), {
    linkedChildren: arrayUnion(childRef.id),
    numberOfChildren: existing.length + 1,
    updatedAt: serverTimestamp(),
  }).catch(() => {})
  return childRef.id
}

/** Patch a child document (children are users docs). */
export async function updateChild(childId, patch) {
  await updateDoc(doc(db, COLLECTIONS.USERS, childId), {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}

/** Delete a child document and unlink it from the parent. */
export async function deleteChild(childId, parentUid) {
  if (parentUid) {
    await updateDoc(doc(db, COLLECTIONS.USERS, parentUid), {
      linkedChildren: arrayRemove(childId),
      updatedAt: serverTimestamp(),
    }).catch(() => {})
  }
  await deleteDoc(doc(db, COLLECTIONS.USERS, childId))
}

/**
 * Permanently delete a parent's data before the Firebase Auth user is deleted.
 * Must run while still authenticated.
 *
 * This is a HARD delete, not the old isActive=false soft delete: the previous
 * project's rules forbade removing user docs, this project's don't (they must
 * stay permissive for the unauthenticated child app). Do not reach for this to
 * "deactivate" an account — nothing here is recoverable.
 *
 * Mood/screen-time/message rows are left behind: they're keyed by childId and
 * unreachable once the children are gone, and purging them from the client
 * would mean an unbounded fan-out of deletes.
 */
export async function deleteAccountData({ uid, children }) {
  const kids = Array.isArray(children) ? children : []
  await Promise.all(
    kids.map((c) => deleteDoc(doc(db, COLLECTIONS.USERS, c.id)).catch(() => {})),
  )
  if (uid) {
    await deleteDoc(doc(db, COLLECTIONS.USERS, uid)).catch(() => {})
  }
}

// ─── Mood ────────────────────────────────────────────────────────────────────
//
// Written by the child app's MoodService. Each entry is a wellbeing survey:
//   childId     — the child's users/{id} doc id
//   score       — 0–100, higher is better (NOT the old 1–6 emotion scale)
//   responses   — { emotional, energy, stress, outlook }
//   timestamp / createdAt — serverTimestamp()
//   dateString  — JS Date.prototype.toDateString(), e.g. "Tue Jun 10 2025"
//
// Queried by single-equality childId then filtered client-side, mirroring the
// child app, so no composite index is required.

/** All mood entries for a child whose timestamp falls inside [fromDate, toDate). */
export async function getMoodEntriesForChildInRange(childId, fromDate, toDate) {
  if (!childId || !(fromDate instanceof Date) || !(toDate instanceof Date)) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  const fromMs = fromDate.getTime()
  const toMs = toDate.getTime()
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const ms = entryMillis(r)
      return typeof ms === 'number' && ms >= fromMs && ms < toMs
    })
    .sort((a, b) => (entryMillis(a) ?? 0) - (entryMillis(b) ?? 0))
}

/** All mood entries for a child within the last `days` (default 7), oldest first. */
export async function getMoodEntriesForChild(childId, days = 7) {
  if (!childId) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  const cutoff = Date.now() - days * 86_400_000
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const ms = entryMillis(r)
      return typeof ms === 'number' && ms >= cutoff
    })
    .sort((a, b) => (entryMillis(a) ?? 0) - (entryMillis(b) ?? 0))
}

/**
 * A child's whole mood history, newest first.
 *
 * The per-child query is unfiltered anyway (see the note above — no composite
 * index exists to range on `timestamp`), so the overview reads the history once
 * and derives today's entry, the latest entry and the running average from it
 * rather than issuing the same query twice.
 */
export async function getMoodHistoryForChild(childId) {
  if (!childId) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.MOOD_ENTRIES), where('childId', '==', childId)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (entryMillis(b) ?? 0) - (entryMillis(a) ?? 0))
}

// `timestamp` is the child app's primary ordering field, but entries written
// through some paths only carry `createdAt`. Prefer timestamp, fall back.
function entryMillis(entry) {
  const ts = entry?.timestamp?.toMillis?.() ?? entry?.createdAt?.toMillis?.()
  return typeof ts === 'number' ? ts : null
}

// ─── Screen time ─────────────────────────────────────────────────────────────
//
// Written by the child app's ScreenTimeService, one row per sync:
//   childId, totalScreenTime, totalHours, appsUsed, dateString, createdAt,
//   topApps[]  — [{ appName, packageName, timeSpent, percentage, timeFormatted }]
//   allApps[]  — [{ appName, packageName, timeSpent, percentage, lastUsed }]
//
// The child re-writes today's row on each sync (delete + re-add), so the latest
// row is the current day's cumulative total rather than a delta.

/** Screen-time entries for a child within the last `days`, newest first. */
export async function getScreenTimeForChild(childId, days = 7) {
  if (!childId) return []
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.SCREEN_TIME_ENTRIES), where('childId', '==', childId)),
  )
  const cutoff = Date.now() - days * 86_400_000
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => {
      const ms = r.createdAt?.toMillis?.()
      return typeof ms === 'number' && ms >= cutoff
    })
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}

// How far back a sync still counts as "latest": a child who hasn't synced in a
// month reads as no data, which is the honest answer.
//
// COST: this does NOT bound the read. The query filters on childId only and the
// date cut happens client-side, so every entry for the child is downloaded each
// time — one real child in this project already has 118, each carrying a full
// `allApps` array. Narrowing it server-side would mean either an orderBy on
// createdAt (needs a childId+createdAt composite index, which isn't deployed) or
// a dateString equality (cheap, but only finds today's row and misses a child
// who last synced yesterday). Left as-is deliberately; revisit if an index gets
// deployed.
const LATEST_SCREEN_TIME_WINDOW_DAYS = 30

/** The child's most recent screen-time entry, or null if they haven't synced recently. */
export async function getLatestScreenTimeForChild(childId) {
  const rows = await getScreenTimeForChild(childId, LATEST_SCREEN_TIME_WINDOW_DAYS)
  return rows[0] ?? null
}

/** Subscribe to a single Firestore document. Returns the unsubscribe function. */
export function listenToDoc(path, callback) {
  const ref = doc(db, ...path.split('/'))
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}
