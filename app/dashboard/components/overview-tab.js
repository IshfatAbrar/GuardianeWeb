import { JojoBanner } from './jojo-banner'
import { StatsGrid } from './stats-grid'
import { TodaysMoodCard } from './todays-mood-card'
import { QuickActionsCard } from './quick-actions-card'
import { LearningModulesCarousel } from './learning-modules-carousel'
import { RecentActivityCard } from './recent-activity-card'

function firstName(profile, user) {
  const full = profile?.fullName || user?.displayName || ''
  const head = full.trim().split(/\s+/)[0]
  if (head) return head
  if (user?.email) return user.email.split('@')[0]
  return null
}

export function OverviewTab({ data }) {
  const {
    user,
    userProfile,
    children,
    alerts,
    activeAlerts,
    modules,
    todaysMood,
    completedAssignmentsCount,
    inProgressAssignmentsCount,
    selectedChildId,
  } = data

  const greetingName = firstName(userProfile, user)
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null

  return (
    <div className="space-y-7 p-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {greetingName ? `Hello ${greetingName},` : 'Hello,'}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Your family&apos;s digital wellbeing recap
          </p>
        </div>
      </div>

      <JojoBanner />

      <StatsGrid
        childrenCount={children.length}
        activeAlertsCount={activeAlerts.length}
        completedCount={completedAssignmentsCount}
        inProgressCount={inProgressAssignmentsCount}
      />

      <div className="grid grid-cols-2 gap-4 pt-2">
        <TodaysMoodCard mood={todaysMood} childName={selectedChild?.name} />
        <QuickActionsCard />
      </div>

      <LearningModulesCarousel modules={modules} />

      <RecentActivityCard alerts={alerts} childList={children} />
    </div>
  )
}
