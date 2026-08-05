'use client'

// Notifications store — three-tier read path that mirrors the architecture spec:
//   L1 in-memory React state (this hook)
//   L2 IndexedDB              (notificationsCache.js, 7-day TTL)
//   L4 Firestore              (source of truth, subscribed via onSnapshot)
//
// L3 Redis is intentionally skipped — there's no backend server, and Firestore's
// onSnapshot already provides the WebSocket-style push tier described as Tier 1.
//
// Read flow on cold start:
//   render → hydrate L1 from L2 immediately (fast paint) → onSnapshot replaces
//   L1 with authoritative L4 data → mirror back to L2.
//
// Write flow (alerts arrive from the child device):
//   Firestore write → onSnapshot fires → L1 updated → async persist to L2.
//
// An "alert" here is a `messages` row the child app wrote with a risk
// classification — there is no separate alerts collection in this schema. See
// lib/messages.js for the contract. Scoping is by parentId + the parent's
// children, since the Android schema has no family document.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from '../context/AuthContext'
import { getChildrenForParent } from './database'
import {
  listenToAlerts,
  alertSeverity,
  messageClassification,
  markMessagesReadByIds,
} from './messages'
import { readCachedAlerts, writeCachedAlerts } from './notificationsCache'

const MAX_ALERTS = 50
const EMPTY_ALERTS = []

const NotificationsContext = createContext({
  alerts: [],
  unreadCount: 0,
  loading: true,
  markAllRead: () => {},
})

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts instanceof Date) return ts.getTime()
  return 0
}

// Flatten an alert `messages` row into a JSON-safe shape for IndexedDB —
// Firestore Timestamps are class instances and can't be structured-cloned.
function serializeAlert(raw) {
  return {
    id: raw.id,
    parentId: raw.parentId ?? null,
    childId: raw.childId ?? null,
    type: messageClassification(raw) || 'Risk alert',
    message: raw.message ?? null,
    severity: alertSeverity(raw),
    isRead: raw.isRead === true,
    status: raw.isRead === true ? null : 'new',
    timestampMs: toMillis(raw.timestamp) || toMillis(raw.createdAt),
  }
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const parentId = user?.uid ?? null

  // null means "children not fetched yet", distinct from '' meaning "this
  // parent genuinely has none" — the two need different loading answers.
  const [childIdsKey, setChildIdsKey] = useState(null)
  const [alertsState, setAlertsState] = useState([])
  const [loadingState, setLoadingState] = useState(true)

  // Drop the previous account's alerts the moment the user changes, in the same
  // render rather than an effect. Otherwise signing in as another parent would
  // briefly show the last parent's risk alerts: the listener is scoped by
  // parentId so nothing wrong is fetched, but the stale rows would still paint
  // until the new snapshot lands. Adjusting state during render is React's
  // documented pattern for this — https://react.dev/learn/you-might-not-need-an-effect
  const [lastParentId, setLastParentId] = useState(parentId)
  if (parentId !== lastParentId) {
    setLastParentId(parentId)
    setChildIdsKey(null)
    setAlertsState([])
    setLoadingState(true)
  }

  // Alerts are scoped per child, so the child list is a prerequisite for the
  // subscription. This provider sits above the dashboard, so it can't reuse
  // useDashboardData's copy and fetches its own.
  useEffect(() => {
    if (!parentId) return undefined
    let cancelled = false
    getChildrenForParent(parentId)
      .then((rows) => {
        if (cancelled) return
        setChildIdsKey(rows.map((c) => c.id).sort().join(','))
      })
      .catch(() => {
        if (!cancelled) setChildIdsKey('')
      })
    return () => {
      cancelled = true
    }
  }, [parentId])

  const activeChildIdsKey = parentId ? childIdsKey : null

  // L2 → L1 hydrate on cold start (fast paint while the listener warms up).
  useEffect(() => {
    if (!parentId) return undefined
    let cancelled = false
    readCachedAlerts(parentId).then((cached) => {
      if (cancelled) return
      if (cached.length > 0) setAlertsState(cached.slice(0, MAX_ALERTS))
    })
    return () => {
      cancelled = true
    }
  }, [parentId])

  // L4 live subscription — Firestore onSnapshot is the WebSocket push tier.
  useEffect(() => {
    if (!activeChildIdsKey) return undefined
    return listenToAlerts(
      { parentId, childIds: activeChildIdsKey.split(',') },
      (rows) => {
        const serialized = rows.map(serializeAlert).slice(0, MAX_ALERTS)
        setAlertsState(serialized)
        setLoadingState(false)
        // Fire-and-forget mirror to L2.
        writeCachedAlerts(serialized).catch(() => {})
      },
    )
  }, [parentId, activeChildIdsKey])

  // Derive the public view rather than resetting state in the effects above.
  // Read alerts are dropped here, not just uncounted — the bell shows what's
  // still outstanding, same as the overview's "active alerts" stat, which
  // filters on this same `isRead` field.
  const alerts = useMemo(
    () =>
      activeChildIdsKey
        ? alertsState.filter((a) => !a.isRead)
        : EMPTY_ALERTS,
    [activeChildIdsKey, alertsState],
  )

  // Signed out: nothing to load. Children not fetched yet: still loading, so the
  // bell doesn't flash "no alerts" and then fill in. No children at all: a
  // settled empty, not a pending one — don't spin forever.
  const loading = !parentId
    ? false
    : activeChildIdsKey === null
      ? true
      : activeChildIdsKey === ''
        ? false
        : loadingState

  // Persists to Firestore (the same isRead flag the overview's alert stats and
  // the alerts tab read), not just a local "seen at" marker — otherwise this
  // button silences the bell without clearing the alert anywhere else, and it
  // comes back on the next snapshot or on another device.
  const markAllRead = useCallback(() => {
    const ids = alertsState.filter((a) => !a.isRead).map((a) => a.id)
    if (ids.length === 0) return
    // Optimistic: hide immediately rather than waiting on the round trip.
    setAlertsState((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: true, status: null } : a)),
    )
    markMessagesReadByIds(ids).catch(() => {})
  }, [alertsState])

  const unreadCount = alerts.length

  const value = useMemo(
    () => ({ alerts, unreadCount, loading, markAllRead }),
    [alerts, unreadCount, loading, markAllRead],
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
