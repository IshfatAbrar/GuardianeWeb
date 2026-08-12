'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { listenToChildrenForParent, listenToMoodHistoryForChild, listenToScreenTimeForChild } from '../../lib/database'
import { listenToAlerts, alertSeverity, messageClassification } from '../../lib/messages'
import {
  fetchAllModules,
  listenToAssignments,
  listenToLearningProgressForChildren,
  isAssignmentCompleted,
  progressFor,
} from '../../lib/learningModules'
import { listenToInsightsForChild } from '../../lib/aiInsights'
import { summarizeMood } from '../../lib/mood'

const MAX_FEED_ALERTS = 10
const EMPTY_ALERTS = []
const EMPTY_PROGRESS = new Map()
// Derived rather than written out, so it can't drift from summarizeMood's shape.
const EMPTY_MOOD = summarizeMood([])

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
 * Everything that can change from the CHILD's device without any action on
 * the web is a live `onSnapshot` listener, not a one-shot fetch — otherwise
 * the parent would have to reload the page to see a new mood entry, a
 * screen-time sync, lesson progress, or a fresh AI insight land. Only
 * `modules` stays one-shot: it's curated/admin content that changes rarely,
 * and the one place the web itself can add to it (custom module creation)
 * already refetches locally on success (see modules-tab.js), so a standing
 * listener would just be paying for reads nothing needs.
 *
 * What it subscribes to / fetches:
 *   • parent profile + uid                    (from AuthContext)
 *   • children (users, parentId + role)       → users collection (live)
 *   • modules                                 → modules collection (one-shot)
 *   • mood history for the selected child     → mood_entries collection (live)
 *   • latest screen-time sync for that child  → screen_time_entries collection (live)
 *   • live risk alerts across all children    → messages collection (live)
 *   • assignments this parent handed out      → module_assignments (live)
 *   • child-written progress on those         → learning_progress (live)
 *   • cached Gemini insights for that child   → aiInsights (live)
 *
 * It also owns `selectedChildId` and defaults it to the first fetched child.
 */
export function useDashboardData() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const uid = user?.uid

  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(true)
  const [alerts, setAlerts] = useState([])

  const [modules, setModules] = useState([])
  const [modulesLoading, setModulesLoading] = useState(true)

  const [assignments, setAssignments] = useState([])
  const [progressById, setProgressById] = useState(EMPTY_PROGRESS)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const [moodHistory, setMoodHistory] = useState({ childId: null, rows: [] })
  const [latestScreenTime, setLatestScreenTime] = useState(null)
  const [insightState, setInsightState] = useState({ childId: null, data: null })

  // Children, live. Selection is reconciled against every snapshot rather than
  // only set once: a listener can shrink the list (a child removed from
  // another tab/device), and leaving selectedChildId pointing at a doc that no
  // longer exists would blank every per-child section rather than falling back.
  useEffect(() => {
    if (!uid) return undefined
    const unsub = listenToChildrenForParent(uid, (rows) => {
      setChildren(rows)
      setChildrenLoading(false)
      setSelectedChildId((prev) =>
        prev && rows.some((c) => c.id === prev) ? prev : (rows[0]?.id ?? null),
      )
    })
    return unsub
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

  // Scoped to whichever child is selected, filtered BEFORE the feed cap rather
  // than after: filtering the already-capped family-wide `alerts` below would
  // mean a child with older alerts could show fewer than MAX_FEED_ALERTS just
  // because a sibling's alerts crowded them out of the top 10 merged.
  const alertsForSelectedChild = useMemo(
    () => visibleAlerts.filter((a) => a.childId === selectedChildId).slice(0, MAX_FEED_ALERTS),
    [visibleAlerts, selectedChildId],
  )

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

  // Assignments this parent has handed out, live.
  useEffect(() => {
    if (!uid) return undefined
    return listenToAssignments(
      uid,
      (rows) => setAssignments(rows),
      () => setAssignments([]),
    )
  }, [uid])

  // Progress rows the CHILD's device writes against those assignments, live.
  useEffect(() => {
    if (!childIdsKey) return undefined
    return listenToLearningProgressForChildren(childIdsKey.split(','), setProgressById)
  }, [childIdsKey])

  // Per-child live listeners for the selected child. Each callback closes over
  // the `selectedChildId` this effect ran with, and React tears the old
  // listeners down before the new child's effect runs — so there's no window
  // where a stale snapshot for the previous child can land tagged as the new
  // one, the same guarantee the old cancelled-flag version gave by hand.
  useEffect(() => {
    if (!selectedChildId) return undefined

    // Tagged with the child id: the mood tiles name the child they are about,
    // so showing the previous child's scores under the new child's name for a
    // frame would be worse than showing nothing.
    const unsubMood = listenToMoodHistoryForChild(selectedChildId, (rows) => {
      setMoodHistory({ childId: selectedChildId, rows })
    })

    const unsubScreenTime = listenToScreenTimeForChild(selectedChildId, (rows) => {
      setLatestScreenTime(rows[0] ?? null)
    })

    // Read-only: GuardParent generates and caches these. A missing doc is the
    // normal case for a parent who only uses the web, not an error. The child id
    // is stored alongside the result so "loading" can be derived from it rather
    // than flipped by hand — switching child then shows a skeleton instead of
    // the previous child's insight.
    const unsubInsights = listenToInsightsForChild(selectedChildId, (insight) => {
      setInsightState({ childId: selectedChildId, data: insight })
    })

    return () => {
      unsubMood()
      unsubScreenTime()
      unsubInsights()
    }
  }, [selectedChildId])

  // Derived, not reset inside the effects above: with no children nothing is
  // subscribed, so the last family's progress must not linger, and insights
  // belong to whichever child is selected right now.
  const visibleProgress = childIdsKey ? progressById : EMPTY_PROGRESS
  const insights = insightState.childId === selectedChildId ? insightState.data : null
  const insightsLoading = !!selectedChildId && insightState.childId !== selectedChildId

  // Latest mood + average for the selected child. Mirrors GuardParent's home
  // screen, which shows the child's most recent entry however old it is —
  // waiting for a mood logged *today* left both tiles blank for weeks at a
  // time, since the child app logs a mood only when the child opens it.
  const mood = useMemo(() => {
    if (moodHistory.childId !== selectedChildId) return EMPTY_MOOD
    return summarizeMood(moodHistory.rows)
  }, [moodHistory, selectedChildId])

  const assignmentCounts = useMemo(() => {
    const completed = assignments.filter((a) => isAssignmentCompleted(a, visibleProgress))
    const started = assignments.filter(
      (a) => !isAssignmentCompleted(a, visibleProgress) && progressFor(a, visibleProgress) > 0,
    )
    return { completed: completed.length, inProgress: started.length }
  }, [assignments, visibleProgress])

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
    mood,
    latestScreenTime,
    insights,
    insightsLoading,

    // shared data
    modules,

    // Risk alerts, newest first, family-wide — used by the Emergency tab's
    // cross-child feed. `activeAlerts` is the unacknowledged set — the child
    // app writes every alert with isRead:false.
    alerts: visibleAlerts.slice(0, MAX_FEED_ALERTS),
    activeAlerts: visibleAlerts.filter((a) => !a.isRead),
    // Same alerts, scoped to selectedChildId — used by the Overview's Recent
    // Activity card so switching children doesn't bleed another child's alerts in.
    alertsForSelectedChild,

    assignments,
    progressById: visibleProgress,
    completedAssignmentsCount: assignmentCounts.completed,
    inProgressAssignmentsCount: assignmentCounts.inProgress,

    loading: authLoading || childrenLoading || modulesLoading,
  }
}
