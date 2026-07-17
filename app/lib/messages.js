// Parent↔child messaging, and the risk alerts that ride the same collection.
//
// SCHEMA CONTRACT — `messages` is written by BOTH Android apps:
//   { parentId, childId, senderType: 'parent'|'child', senderId, message,
//     timestamp, isRead, createdAt }
// Child-written risk alerts add:
//   { isRiskAlert: true, messageType: 'risk_alert',
//     metadata: { source, classification, confidence, childName } }
//
// There is no separate `alerts` collection in this schema — an alert IS a
// message. See isAlertMessage for the exact test, which mirrors GuardParent's.
//
// Timestamps are left as raw Firestore Timestamps rather than converted to Date
// (GuardParent converts). The web's components expect `.toDate()`/`.toMillis()`
// throughout, so converting here would silently blank every relative time.

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  limitToLast,
  onSnapshot,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

export const MESSAGES_COLLECTION = 'messages'

// Conversations get long: a real parent/child pair in this project already has
// 700+ messages, and both listeners below would otherwise stream every one of
// them on open. limitToLast keeps the newest slice, which is what a chat shows
// anyway, and is served by the same composite index as the unbounded query.
const CONVERSATION_WINDOW = 200

// The alert listener runs app-wide (it backs the notification bell) and once
// per child, so an unbounded read here is the most expensive thing on the site.
// Alerts are filtered out of this window client-side — a wider window than the
// bell's 50-alert cap, since ordinary chat shares the collection and dilutes it.
const ALERT_SCAN_WINDOW = 300

// The child app builds alert text as `Risk detected: <label> (<confidence>): …`
// (AlertService.sendRiskAlert). GuardParent treats that prefix as an alert
// marker on its own, so older alerts written before `metadata` existed still
// register. Keep both tests.
const RISK_PREFIX = 'Risk detected:'

/** The classifier label on an alert, or null. Checks both field positions. */
export function messageClassification(message) {
  return message?.metadata?.classification || message?.classification || null
}

/**
 * Is this message a risk alert rather than ordinary chat?
 *
 * Mirrors GuardParent's `isAlert` exactly: child-sent, AND carrying either a
 * classification or the "Risk detected:" prefix. The senderType check matters —
 * without it a parent replying "Risk detected: ..." would forge an alert.
 *
 * A bare `Boolean(classification)` is safe here because the child only ever
 * writes a classification when TextClassifier.isRiskLabel() passes, so the
 * benign 'Safe/Neutral' label never reaches Firestore.
 */
export function isAlertMessage(message) {
  if (message?.senderType !== 'child') return false
  if (messageClassification(message)) return true
  return typeof message?.message === 'string' && message.message.startsWith(RISK_PREFIX)
}

// The child's on-device classifier emits exactly these labels
// (TextClassifier.getDefaultLabels); only the first three are treated as risks
// and thus ever sent. Anything unrecognised degrades to 'info' rather than
// being dropped, so a future label still surfaces to the parent.
const SEVERITY_BY_CLASSIFICATION = {
  'Suicidal Reference': 'critical',
  'Attacking Behavior': 'warning',
  'Emotional Distress': 'warning',
}

/** Severity bucket for an alert message, for the activity feed's colour dot. */
export function alertSeverity(message) {
  return SEVERITY_BY_CLASSIFICATION[messageClassification(message)] ?? 'info'
}

function rowFrom(snapshotDoc) {
  return { id: snapshotDoc.id, ...snapshotDoc.data() }
}

// A message written locally has a null `timestamp` until the server stamps it
// (serverTimestamp resolves server-side), so onSnapshot's optimistic local echo
// would otherwise sort to the top and jump when acknowledged. Fall back to
// createdAt, then to "now" so a pending message sorts last, where the user
// expects their just-sent message to be.
function messageMillis(message) {
  const ms = message?.timestamp?.toMillis?.() ?? message?.createdAt?.toMillis?.()
  return typeof ms === 'number' ? ms : Date.now()
}

/**
 * Live parent↔child conversation, oldest first.
 *
 * Query shape (parentId + childId equality, orderBy timestamp) is backed by an
 * existing composite index in GuardParent's firestore.indexes.json, so this
 * needs no index deployment. Returns the unsubscribe function.
 */
export function listenToConversation({ parentId, childId }, callback) {
  if (!parentId || !childId) return () => {}
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('parentId', '==', parentId),
    where('childId', '==', childId),
    orderBy('timestamp', 'asc'),
    limitToLast(CONVERSATION_WINDOW),
  )
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(rowFrom)),
    () => callback([]),
  )
}

/**
 * Live risk alerts across every child, newest first.
 *
 * One listener per child rather than a single `parentId`-only query: pairing a
 * parentId equality with an orderBy on timestamp would need a composite index
 * that isn't deployed, whereas the per-child shape reuses the same index
 * listenToConversation relies on. Returns an unsubscribe for the whole set.
 */
export function listenToAlerts({ parentId, childIds }, callback) {
  const ids = Array.isArray(childIds) ? childIds.filter(Boolean) : []
  if (!parentId || ids.length === 0) {
    callback([])
    return () => {}
  }

  const byChild = new Map()
  const emit = () => {
    const merged = Array.from(byChild.values())
      .flat()
      .sort((a, b) => messageMillis(b) - messageMillis(a))
    callback(merged)
  }

  const unsubs = ids.map((childId) =>
    onSnapshot(
      query(
        collection(db, MESSAGES_COLLECTION),
        where('parentId', '==', parentId),
        where('childId', '==', childId),
        orderBy('timestamp', 'asc'),
        limitToLast(ALERT_SCAN_WINDOW),
      ),
      (snap) => {
        byChild.set(childId, snap.docs.map(rowFrom).filter(isAlertMessage))
        emit()
      },
      () => {
        byChild.set(childId, [])
        emit()
      },
    ),
  )

  return () => unsubs.forEach((u) => u())
}

/** Send a message from the parent to a child. */
export async function sendMessage({ parentId, childId, message }) {
  const text = typeof message === 'string' ? message.trim() : ''
  if (!parentId || !childId) throw new Error('Missing parentId or childId')
  if (!text) throw new Error('Message cannot be empty')
  await addDoc(collection(db, MESSAGES_COLLECTION), {
    parentId,
    childId,
    senderType: 'parent',
    senderId: parentId,
    message: text,
    timestamp: serverTimestamp(),
    isRead: false,
    createdAt: serverTimestamp(),
  })
}

/**
 * Mark the child's ordinary chat messages as read.
 *
 * Alerts are deliberately left unread: they're acknowledged from the alerts
 * view, not by merely opening the conversation. Mirrors GuardParent's
 * markNonAlertChildMessagesAsRead.
 */
export async function markChildMessagesAsRead({ parentId, childId }) {
  if (!parentId || !childId) return
  const snap = await getDocs(
    query(
      collection(db, MESSAGES_COLLECTION),
      where('parentId', '==', parentId),
      where('childId', '==', childId),
      where('senderType', '==', 'child'),
      where('isRead', '==', false),
    ),
  )
  await Promise.all(
    snap.docs
      .map(rowFrom)
      .filter((m) => !isAlertMessage(m))
      .map((m) =>
        updateDoc(doc(db, MESSAGES_COLLECTION, m.id), { isRead: true }).catch(() => {}),
      ),
  )
}

/** Mark specific messages read by id — used to acknowledge alerts. */
export async function markMessagesReadByIds(messageIds) {
  const ids = Array.isArray(messageIds) ? messageIds.filter(Boolean) : []
  await Promise.all(
    ids.map((id) =>
      updateDoc(doc(db, MESSAGES_COLLECTION, id), { isRead: true }).catch(() => {}),
    ),
  )
}
