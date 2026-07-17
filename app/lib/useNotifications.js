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
import { listenToAlerts, alertSeverity, messageClassification } from './messages'
import { readCachedAlerts, writeCachedAlerts } from './notificationsCache'

const MAX_ALERTS = 50
const READ_AT_KEY = 'guardiane.notifications.readAt'
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
    status: raw.isRead === true ? null : 'new',
    timestampMs: toMillis(raw.timestamp) || toMillis(raw.createdAt),
  }
}

function readReadAt() {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(READ_AT_KEY)
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const parentId = user?.uid ?? null

  // null means "children not fetched yet", distinct from '' meaning "this
  // parent genuinely has none" — the two need different loading answers.
  const [childIdsKey, setChildIdsKey] = useState(null)
  const [alertsState, setAlertsState] = useState([])
  const [loadingState, setLoadingState] = useState(true)
  const [readAt, setReadAt] = useState(() => readReadAt())

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
  const alerts = useMemo(
    () => (activeChildIdsKey ? alertsState : EMPTY_ALERTS),
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

  const markAllRead = useCallback(() => {
    const now = Date.now()
    setReadAt(now)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(READ_AT_KEY, String(now))
    }
  }, [])

  const unreadCount = useMemo(
    () => alerts.filter((a) => a.timestampMs > readAt).length,
    [alerts, readAt],
  )

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
