'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getChildrenForParent,
  getAlertsForFamily,
  getAssignmentsForFamily,
  getTodaysMoodForChild,
  getModules,
} from '../../lib/database'

/**
 * Single hook that owns all reads for the dashboard overview.
 *
 * What it fetches:
 *   • parent profile + uid                  (from AuthContext)
 *   • children (where parentIds contains)   → children collection
 *   • recent + active alerts                → alerts collection
 *   • assignments                           → assignments collection
 *   • modules (public read)                 → modules collection
 *   • today's mood for the selected child   → moodEntries collection
 *
 * It also owns `selectedChildId` and defaults it to the first fetched child.
 */
export function useDashboardData() {
  const { user, userProfile, loading: authLoading } = useAuth()
  const uid = user?.uid
  const familyId = userProfile?.familyId

  const [children, setChildren] = useState([])
  const [childrenLoading, setChildrenLoading] = useState(true)

  const [alerts, setAlerts] = useState([])
  const [activeAlerts, setActiveAlerts] = useState([])
  const [assignments, setAssignments] = useState([])
  const [modules, setModules] = useState([])
  const [familyLoading, setFamilyLoading] = useState(true)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const [todaysMood, setTodaysMood] = useState(null)

  // Children
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    setChildrenLoading(true)
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

  // Family-scoped reads (alerts + assignments + modules)
  useEffect(() => {
    if (!familyId) {
      setFamilyLoading(false)
      return
    }
    let cancelled = false
    setFamilyLoading(true)
    Promise.allSettled([
      getAlertsForFamily(familyId, { max: 10 }),
      getAlertsForFamily(familyId, { activeOnly: true, max: 50 }),
      getAssignmentsForFamily(familyId),
      getModules(),
    ])
      .then(([alertsRes, activeRes, assignmentsRes, modulesRes]) => {
        if (cancelled) return
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value)
        if (activeRes.status === 'fulfilled') setActiveAlerts(activeRes.value)
        if (assignmentsRes.status === 'fulfilled') setAssignments(assignmentsRes.value)
        if (modulesRes.status === 'fulfilled') setModules(modulesRes.value)
      })
      .finally(() => {
        if (!cancelled) setFamilyLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [familyId])

  // Mood for the selected child
  useEffect(() => {
    if (!selectedChildId) {
      setTodaysMood(null)
      return
    }
    let cancelled = false
    getTodaysMoodForChild(selectedChildId)
      .then((m) => {
        if (!cancelled) setTodaysMood(m)
      })
      .catch(() => {
        if (!cancelled) setTodaysMood(null)
      })
    return () => {
      cancelled = true
    }
  }, [selectedChildId])

  const completedAssignmentsCount = assignments.filter((a) => a.isCompleted || a.status === 'completed').length
  const inProgressAssignmentsCount = assignments.filter((a) => a.status === 'in_progress').length

  return {
    // identity
    user,
    userProfile,
    familyId,

    // children
    children,
    childrenLoading,
    selectedChildId,
    setSelectedChildId,

    // family-scoped data
    alerts,
    activeAlerts,
    assignments,
    modules,
    todaysMood,
    completedAssignmentsCount,
    inProgressAssignmentsCount,

    // status
    loading: authLoading || childrenLoading || familyLoading,
  }
}
