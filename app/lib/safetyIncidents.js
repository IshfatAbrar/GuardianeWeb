// JS port of iOS safety/crisis handling
// (Services/RealTimeSyncService.swift `startAlertsSync` + AlertCenterViewModel).
//
// Collection: `safety_incidents`. Document shape mirrors RealTimeAlert.swift:
//   { confidence, deviceInfo, explanation, firestoreTimestamp, message,
//     safetyClass, sessionId, childId, timestamp, wasBlocked, isResolved }
//
// iOS listens to the global collection, ordered by firestoreTimestamp desc.
// We restrict surfaced rows to incidents whose `childId` is in the current
// family's children list — defense in depth on top of the Firestore rules.

import {
  collection,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

const SAFETY_INCIDENTS = 'safety_incidents'

export const SAFETY_CLASS = {
  SUICIDAL: 'Suicidal Reference',
  EMOTIONAL: 'Emotional Distress',
  ATTACKING: 'Attacking Behavior',
  SAFE: 'Safe/Neutral',
}

export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

function tsMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  return 0
}

/**
 * Mirrors `RealTimeAlert.severity`. Maps a safety class to a severity bucket,
 * falling back to a confidence-based heuristic for unknown classes.
 */
export function severityFor(incident) {
  if (!incident) return SEVERITY.LOW
  switch (incident.safetyClass) {
    case SAFETY_CLASS.SUICIDAL:
      return SEVERITY.CRITICAL
    case SAFETY_CLASS.EMOTIONAL:
    case SAFETY_CLASS.ATTACKING:
      return SEVERITY.HIGH
    case SAFETY_CLASS.SAFE:
      return SEVERITY.LOW
    default: {
      const c = Number(incident.confidence) || 0
      if (c > 0.8) return SEVERITY.HIGH
      if (c > 0.5) return SEVERITY.MEDIUM
      return SEVERITY.LOW
    }
  }
}

export function isHighRisk(incident) {
  return (
    incident?.safetyClass === SAFETY_CLASS.SUICIDAL ||
    incident?.safetyClass === SAFETY_CLASS.ATTACKING
  )
}

export function isCritical(incident) {
  return (
    severityFor(incident) === SEVERITY.CRITICAL ||
    incident?.safetyClass === SAFETY_CLASS.SUICIDAL
  )
}

/**
 * Real-time listener on `safety_incidents`. Restricted client-side to
 * incidents whose `childId` is in `familyChildIds` — pass `null` to skip the
 * filter. Returns an unsubscribe function.
 */
export function listenToSafetyIncidents({
  familyChildIds = null,
  max = 100,
  onUpdate,
  onError,
}) {
  const q = query(
    collection(db, SAFETY_INCIDENTS),
    orderBy('firestoreTimestamp', 'desc'),
    limit(max),
  )
  const allow = Array.isArray(familyChildIds) ? new Set(familyChildIds) : null
  return onSnapshot(
    q,
    (snap) => {
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (allow) rows = rows.filter((r) => allow.has(r.childId))
      onUpdate?.(rows)
    },
    (err) => onError?.(err),
  )
}

/**
 * Mark an incident resolved. Mirrors `updateSafetyIncident(id, isResolved: true)`.
 */
export async function markIncidentResolved(incidentId) {
  await updateDoc(doc(db, SAFETY_INCIDENTS, incidentId), { isResolved: true })
}

/**
 * "2m ago" / "3h ago" / "4d ago" style for the alert cards.
 */
export function formatRelativeTime(value) {
  const ms = tsMillis(value)
  if (!ms) return '—'
  const diff = Date.now() - ms
  if (diff < 60_000) return 'just now'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  try {
    const d = new Date(ms)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

/**
 * Default escalation chain matching iOS `AlertCenterViewModel.escalationChain`.
 * "Pending response" / "Standby" is rendered in the view.
 */
export const DEFAULT_ESCALATION_CHAIN = [
  { level: 1, role: 'AI Detection', active: true },
  { level: 2, role: 'Guardian Notified', active: true },
  { level: 3, role: 'Service Provider', active: false },
]
