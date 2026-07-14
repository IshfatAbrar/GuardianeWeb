// JS port of iOS access-request handling
// (Services/FirebaseService.swift + ViewModels/AccessRequestViewModel.swift).
//
// Document shape mirrors AccessRequest.swift:
//   { childId, parentId, moduleId, requestedApp, requestedAt, status,
//     approvedAt?, deniedAt?, timeLimit?, expiresAt?, reason? }
//
// STORAGE — requests can live in TWO places:
//   1. Legacy top-level `accessRequests` collection (queried by `parentId`).
//   2. `children/{childId}/accessRequests/{id}` subcollection — this is where
//      the iOS Kid app actually writes them (LearningModuleModels.swift). The
//      old web listener only read (1), so kid-originated requests never showed
//      up on the parent dashboard. We now merge both.
//
// Rows are tagged with `_source` ('top' | 'sub') and `childId` so the mutation
// helpers can resolve the correct document reference. We also apply a
// client-side family filter so only requests for the parent's current children
// are surfaced ("only the family's children, not other children").

import {
  collection,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const ACCESS_REQUESTS = 'accessRequests'

export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  EXPIRED: 'expired',
}

function tsMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return 0
}

// Resolve the Firestore document reference for a request. Accepts either a
// request row (preferred — carries `_source` + `childId`) or a bare id string
// (treated as a legacy top-level doc for backwards compatibility).
function requestRef(requestOrId) {
  if (requestOrId && typeof requestOrId === 'object') {
    const { id, childId, _source } = requestOrId
    if (_source === 'sub' && childId) {
      return doc(db, 'children', childId, ACCESS_REQUESTS, id)
    }
    return doc(db, ACCESS_REQUESTS, id)
  }
  return doc(db, ACCESS_REQUESTS, requestOrId)
}

/**
 * Real-time listener — mirrors iOS `FirebaseService.listenToAccessRequests`.
 * Filters by `parentId`. The optional `familyChildIds` list further restricts
 * the surfaced rows to children that belong to this family (so the parent
 * never sees requests for a child that's no longer in their family). Pass
 * `null` to skip the client-side family filter.
 *
 * Returns an unsubscribe function. `onUpdate(rows)` and `onError(err)` are
 * the snapshot callbacks.
 */
export function listenToAccessRequests({
  parentId,
  familyChildIds = null,
  onUpdate,
  onError,
}) {
  if (!parentId) return () => {}

  const childIds = Array.isArray(familyChildIds) ? familyChildIds : []
  const allow = Array.isArray(familyChildIds) ? new Set(familyChildIds) : null

  // Each source (the top-level query + one per child subcollection) writes its
  // latest snapshot into `buckets`; `emit` merges, de-dupes, filters and sorts.
  const buckets = new Map()
  const unsubs = []
  let started = false

  function emit() {
    const merged = new Map()
    for (const rows of buckets.values()) {
      for (const r of rows) merged.set(`${r.childId || 'top'}:${r.id}`, r)
    }
    let out = Array.from(merged.values())
    if (allow) out = out.filter((r) => allow.has(r.childId))
    out.sort((a, b) => tsMillis(b.requestedAt) - tsMillis(a.requestedAt))
    onUpdate?.(out)
  }

  // (1) Legacy top-level collection, keyed by parentId.
  unsubs.push(
    onSnapshot(
      query(collection(db, ACCESS_REQUESTS), where('parentId', '==', parentId)),
      (snap) => {
        buckets.set(
          'top',
          snap.docs.map((d) => ({ ...d.data(), id: d.id, _source: 'top' })),
        )
        if (started) emit()
      },
      (err) => onError?.(err),
    ),
  )

  // (2) Per-child subcollections — where the iOS Kid app writes requests.
  for (const childId of childIds) {
    unsubs.push(
      onSnapshot(
        collection(db, 'children', childId, ACCESS_REQUESTS),
        (snap) => {
          buckets.set(
            `sub:${childId}`,
            snap.docs.map((d) => ({ ...d.data(), id: d.id, childId, _source: 'sub' })),
          )
          if (started) emit()
        },
        (err) => onError?.(err),
      ),
    )
  }

  started = true
  emit()
  return () => {
    for (const unsub of unsubs) unsub()
  }
}

/**
 * Approve a pending request. Matches iOS `approveRequest(_:)`.
 * `timeLimitSeconds` defaults to 1 hour. `expiresAt` is computed as
 * now + timeLimit. Optional `reason` is attached if non-empty.
 */
export async function approveAccessRequest(request, { timeLimitSeconds = 3600, reason = '' } = {}) {
  const now = new Date()
  const expires = new Date(now.getTime() + timeLimitSeconds * 1000)
  const data = {
    status: REQUEST_STATUS.APPROVED,
    approvedAt: serverTimestamp(),
    timeLimit: timeLimitSeconds,
    expiresAt: Timestamp.fromDate(expires),
  }
  const trimmedReason = (reason || '').trim()
  if (trimmedReason) data.reason = trimmedReason
  await updateDoc(requestRef(request), data)
}

/**
 * Deny a pending request. Matches iOS `denyRequest(_:reason:)`.
 * `request` is the request row (preferred) or a legacy id string.
 */
export async function denyAccessRequest(request, { reason = '' } = {}) {
  const data = {
    status: REQUEST_STATUS.DENIED,
    deniedAt: serverTimestamp(),
  }
  const trimmedReason = (reason || '').trim()
  if (trimmedReason) data.reason = trimmedReason
  await updateDoc(requestRef(request), data)
}

/**
 * Hard-delete a request. Matches iOS `deleteAccessRequest(requestId:)`.
 * `request` is the request row (preferred) or a legacy id string.
 */
export async function deleteAccessRequest(request) {
  await deleteDoc(requestRef(request))
}

/**
 * True if the request was approved with an expiry that's now in the past.
 */
export function isAccessRequestExpired(request) {
  if (!request?.expiresAt) return false
  const ms = tsMillis(request.expiresAt)
  return ms > 0 && ms < Date.now()
}

/**
 * Effective status — promotes approved-but-past-expiry to `expired`.
 * Mirrors how iOS treats expired approvals.
 */
export function effectiveRequestStatus(request) {
  if (!request) return REQUEST_STATUS.PENDING
  if (request.status === REQUEST_STATUS.APPROVED && isAccessRequestExpired(request)) {
    return REQUEST_STATUS.EXPIRED
  }
  return request.status || REQUEST_STATUS.PENDING
}

/**
 * Format a time-limit (in seconds) as a "Xh Ym" / "Ym" string.
 * Matches iOS `getTimeLimitDisplay(_:)`.
 */
export function formatTimeLimit(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export const TIME_LIMIT_OPTIONS = [
  { id: 30 * 60, label: '30 minutes' },
  { id: 60 * 60, label: '1 hour' },
  { id: 2 * 60 * 60, label: '2 hours' },
  { id: 4 * 60 * 60, label: '4 hours' },
  { id: 24 * 60 * 60, label: '1 day' },
]

export const DENIAL_QUICK_REASONS = [
  'Screen time limit reached for today',
  'Please complete more learning modules before requesting access',
  'This app is not appropriate for your age',
  'Please complete your homework first',
]
