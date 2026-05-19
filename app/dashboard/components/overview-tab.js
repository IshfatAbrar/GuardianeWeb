import { JojoBanner } from './jojo-banner'
import { StatsGrid } from './stats-grid'
import { TodaysMoodCard } from './todays-mood-card'
import { QuickActionsCard } from './quick-actions-card'
import { LearningModulesCarousel } from './learning-modules-carousel'
import { RecentActivityCard } from './recent-activity-card'

export function OverviewTab() {
  return (
    <div className="space-y-7">

      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">Hello Sarah,</h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">Your family&apos;s digital wellbeing recap</p>
        </div>
      </div>

      <JojoBanner />

      <StatsGrid />

      <div className="grid grid-cols-2 gap-4 pt-2">
        <TodaysMoodCard />
        <QuickActionsCard />
      </div>

      <LearningModulesCarousel />

      <RecentActivityCard />

    </div>
  )
}
