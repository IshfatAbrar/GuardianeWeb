'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getChildrenForParent,
  getMoodHistoryForChild,
  getLatestScreenTimeForChild,
} from '../../lib/database'
import { listenToAlerts, alertSeverity, messageClassification } from '../../lib/messages'
import {
  fetchAllModules,
  listenToAssignments,
  fetchLearningProgressForChildren,
  isAssignmentCompleted,
  progressFor,
} from '../../lib/learningModules'
import { fetchInsightsForChild } from '../../lib/aiInsights'
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
 * What it fetches:
 *   • parent profile + uid                    (from AuthContext)
 *   • children (users, parentId + role)       → users collection
 *   • modules                                 → modules collection
 *   • mood history for the selected child     → mood_entries collection
 *   • latest screen-time sync for that child  → screen_time_entries collection
 *   • live risk alerts across all children    → messages collection
 *
 *   • assignments + child-written progress       → module_assignments,
 *                                                   learning_progress
 *   • cached Gemini insights for that child      → aiInsights
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

  // Assignments this parent has handed out, live, plus the progress rows the
  // CHILD's device writes against them. Progress is a one-shot read: the child
  // updates it as lessons are finished, which is not something the parent needs
  // to watch tick over in real time.
  useEffect(() => {
    if (!uid) return undefined
    return listenToAssignments(
      uid,
      (rows) => setAssignments(rows),
      () => setAssignments([]),
    )
  }, [uid])

  useEffect(() => {
    if (!childIdsKey) return undefined
    let cancelled = false
    fetchLearningProgressForChildren(childIdsKey.split(','))
      .then((map) => {
        if (!cancelled) setProgressById(map)
      })
      .catch(() => {
        if (!cancelled) setProgressById(EMPTY_PROGRESS)
      })
    return () => {
      cancelled = true
    }
  }, [childIdsKey])

  // Per-child reads for the selected child.
  useEffect(() => {
    if (!selectedChildId) return
    let cancelled = false

    // Tagged with the child id: the mood tiles name the child they are about,
    // so showing the previous child's scores under the new child's name for a
    // frame would be worse than showing nothing.
    getMoodHistoryForChild(selectedChildId)
      .then((rows) => {
        if (!cancelled) setMoodHistory({ childId: selectedChildId, rows })
      })
      .catch(() => {
        if (!cancelled) setMoodHistory({ childId: selectedChildId, rows: [] })
      })

    getLatestScreenTimeForChild(selectedChildId)
      .then((s) => {
        if (!cancelled) setLatestScreenTime(s)
      })
      .catch(() => {
        if (!cancelled) setLatestScreenTime(null)
      })

    // Read-only: GuardParent generates and caches these. A missing doc is the
    // normal case for a parent who only uses the web, not an error. The child id
    // is stored alongside the result so "loading" can be derived from it rather
    // than flipped by hand — switching child then shows a skeleton instead of
    // the previous child's insight.
    fetchInsightsForChild(selectedChildId)
      .then((i) => {
        if (!cancelled) setInsightState({ childId: selectedChildId, data: i })
      })
      .catch(() => {
        if (!cancelled) setInsightState({ childId: selectedChildId, data: null })
      })

    return () => {
      cancelled = true
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

    // Risk alerts, newest first. `activeAlerts` is the unacknowledged set —
    // the child app writes every alert with isRead:false.
    alerts: visibleAlerts.slice(0, MAX_FEED_ALERTS),
    activeAlerts: visibleAlerts.filter((a) => !a.isRead),

    assignments,
    progressById: visibleProgress,
    completedAssignmentsCount: assignmentCounts.completed,
    inProgressAssignmentsCount: assignmentCounts.inProgress,

    loading: authLoading || childrenLoading || modulesLoading,
  }
}
