'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getChildrenForParent,
  getTodaysMoodForChild,
  getLatestScreenTimeForChild,
} from '../../lib/database'
import { listenToAlerts, alertSeverity, messageClassification } from '../../lib/messages'
import { fetchAllModules } from '../../lib/learningModules'

const MAX_FEED_ALERTS = 10
const EMPTY_ALERTS = []

// Shape a `messages` alert row into what the activity feed and stats expect.
// `type` is the short label the feed shows in bold; the raw `message` is the
// full "Risk detected: … (0.92): SMS: …" line the child app composed, which is
// far too long for a one-line row.
function toAlertRow(message) {
  return {
    id: message.id,
    childId: message.childId,
    severity: alertSeverity(message),
    type: messageClassification(message) || 'Risk alert',
    message: message.message,
    timestamp: message.timestamp,
    isRead: message.isRead === true,
    status: message.isRead === true ? null : 'new',
  }
}

/**
 * Single hook that owns all reads for the dashboard overview.
 *
 * What it fetches:
 *   • parent profile + uid                    (from AuthContext)
 *   • children (users, parentId + role)       → users collection
 *   • modules                                 → modules collection
 *   • today's mood for the selected child     → mood_entries collection
 *   • latest screen-time sync for that child  → screen_time_entries collection
 *   • live risk alerts across all children    → messages collection
 *
 * It also owns `selectedChildId` and defaults it to the first fetched child.
 *
 * `assignments` is still returned empty: it existed only in the old
 * guardianeusf `assignments` collection, and the Android parent app assigns work
 * via `module_assignments` instead. Porting that is the remaining parity work;
 * the key stays so the overview components keep rendering their empty states.
 */
export function useDashboardData() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const uid = user?.uid

  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [alerts, setAlerts] = useState([])

  const [modules, setModules] = useState([])
  const [modulesLoading, setModulesLoading] = useState(true)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const [todaysMood, setTodaysMood] = useState(null)
  const [latestScreenTime, setLatestScreenTime] = useState(null)

  // Children
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    getChildrenForParent(uid)
      .then((rows) => {
        if (cancelled) return
        setChildren(rows)
        if (rows.length > 0 && !selectedChildId) {
          setSelectedChildId(rows[0].id)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChildrenLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  // Live risk alerts, merged across every child. Keyed on a joined id string
  // rather than the `children` array so re-fetching children with identical ids
  // doesn't tear down and rebuild every listener.
  const childIdsKey = children.map((c) => c.id).sort().join(',')
  const alertsSubscribed = !!uid && !!childIdsKey
  useEffect(() => {
    if (!alertsSubscribed) return undefined
    return listenToAlerts(
      { parentId: uid, childIds: childIdsKey.split(',') },
      (rows) => setAlerts(rows.map(toAlertRow)),
    )
  }, [alertsSubscribed, uid, childIdsKey])

  // Derived rather than reset inside the effect: with no children there is
  // nothing subscribed, so the last-known alerts must not keep showing.
  const visibleAlerts = alertsSubscribed ? alerts : EMPTY_ALERTS

  // Modules are readable by any signed-in parent — not scoped to this family.
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    fetchAllModules()
      .then((rows) => {
        if (!cancelled) setModules(rows)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setModulesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [uid])

  // Per-child reads for the selected child.
  useEffect(() => {
    if (!selectedChildId) return
    let cancelled = false

    getTodaysMoodForChild(selectedChildId)
      .then((m) => {
        if (!cancelled) setTodaysMood(m)
      })
      .catch(() => {
        if (!cancelled) setTodaysMood(null)
      })

    getLatestScreenTimeForChild(selectedChildId)
      .then((s) => {
        if (!cancelled) setLatestScreenTime(s)
      })
      .catch(() => {
        if (!cancelled) setLatestScreenTime(null)
      })

    return () => {
      cancelled = true
    }
  }, [selectedChildId])

  return {
    // identity
    user,
    userProfile,

    // children
    children,
    childrenLoading,
    selectedChildId,
    setSelectedChildId,

    // per-child data
    todaysMood,
    latestScreenTime,

    // shared data
    modules,

    // Risk alerts, newest first. `activeAlerts` is the unacknowledged set —
    // the child app writes every alert with isRead:false.
    alerts: visibleAlerts.slice(0, MAX_FEED_ALERTS),
    activeAlerts: visibleAlerts.filter((a) => !a.isRead),

    // Not yet ported to this schema — see the note above.
    assignments: [],
    completedAssignmentsCount: 0,
    inProgressAssignmentsCount: 0,

    loading: authLoading || childrenLoading || modulesLoading,
  }
}
