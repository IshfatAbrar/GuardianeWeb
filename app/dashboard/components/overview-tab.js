"use client";

import { useState } from "react";
import { JojoBanner } from "./jojo-banner";
import { StatsGrid } from "./stats-grid";
import { TodaysMoodCard } from "./todays-mood-card";
import { QuickActionsCard } from "./quick-actions-card";
import { ScreenTimeCard } from "./screen-time-card";
import { LearningModulesCarousel } from "./learning-modules-carousel";
import { RecentActivityCard } from "./recent-activity-card";
import { AiInsightsCard } from "./ai-insights-card";
import { EmergencyCallModal } from "./emergency-call-modal";
import { MoodReportPage } from "./mood-report-page";
import { AppLimitsPage } from "./app-limits-page";
import { ScreenTimePage } from "./screen-time-page";
import { AccessRequestsCard } from "./access-requests-card";
import { supportsAppLimits, supportsDailyLimit } from "../../lib/childDevice";

function firstName(profile, user) {
  const full = profile?.name || user?.displayName || "";
  const head = full.trim().split(/\s+/)[0];
  if (head) return head;
  if (user?.email) return user.email.split("@")[0];
  return null;
}

function placeEmergencyCall() {
  if (typeof window !== "undefined") {
    window.location.href = "tel:911";
  }
}

export function OverviewTab({ data, onNavigate, onOpenModule }) {
  const {
    user,
    userProfile,
    children,
    alertsForSelectedChild,
    activeAlerts,
    modules,
    mood,
    latestScreenTime,
    insights,
    insightsLoading,
    completedAssignmentsCount,
    inProgressAssignmentsCount,
    selectedChildId,
    pendingAccessRequests,
  } = data;

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  // Report, Screen Time and App Limits open as full pages in place of the
  // Home content: null | "report" | "screenTime" | "appLimits".
  const [subpage, setSubpage] = useState(null);

  const greetingName = firstName(userProfile, user);
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;
  // iOS children get the whole-device daily limit, Android children per-app
  // limits; a child whose device hasn't reported its platform gets both.
  const hiddenActions = [
    ...(selectedChild && !supportsAppLimits(selectedChild)
      ? ["appLimits"]
      : []),
    ...(selectedChild && !supportsDailyLimit(selectedChild)
      ? ["screenTimeLimit"]
      : []),
  ];

  const go = (tab) => onNavigate?.(tab);
  const openReport = () => {
    if (selectedChild) setSubpage("report");
  };
  const closeSubpage = () => setSubpage(null);

  if (subpage === "report" && selectedChild) {
    return <MoodReportPage child={selectedChild} onBack={closeSubpage} />;
  }
  if (subpage === "screenTime") {
    return (
      <ScreenTimePage
        childList={children.filter(supportsDailyLimit)}
        initialChildId={selectedChildId}
        onBack={closeSubpage}
      />
    );
  }
  if (subpage === "appLimits") {
    return (
      <AppLimitsPage
        childList={children.filter(supportsAppLimits)}
        initialChildId={selectedChildId}
        onBack={closeSubpage}
      />
    );
  }

  return (
    <div className="space-y-7 p-6">
      {/* Greeting */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {greetingName ? `Hello ${greetingName},` : "Hello,"}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Your family&apos;s digital wellbeing recap
          </p>
        </div>
      </div>

      <JojoBanner
        onTalk={() => go("chatbot")}
        onLearnMore={() => go("chatbot")}
      />

      <StatsGrid
        childrenCount={children.length}
        activeAlertsCount={activeAlerts.length}
        completedCount={completedAssignmentsCount}
        inProgressCount={inProgressAssignmentsCount}
        wellbeing={mood?.average}
        wellbeingChildName={selectedChild?.name}
      />

      <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
        <TodaysMoodCard
          mood={mood}
          childName={selectedChild?.name}
          onFullReport={openReport}
        />
        <ScreenTimeCard
          entry={latestScreenTime}
          childName={selectedChild?.name}
          child={selectedChild}
          onManage={() => setSubpage("screenTime")}
        />
        <QuickActionsCard
          onReports={openReport}
          onMessages={() => go("messaging")}
          onEmergency={() => setEmergencyOpen(true)}
          onAppLimits={() => setSubpage("appLimits")}
          onScreenTimeLimit={() => setSubpage("screenTime")}
          onAssignModule={() => go("modules")}
          onLearningHub={() => go("learning")}
          hiddenActions={hiddenActions}
        />
      </div>

      {selectedChild && (
        <AiInsightsCard
          insights={insights}
          loading={insightsLoading}
          childName={selectedChild.name}
        />
      )}

      <LearningModulesCarousel
        modules={modules}
        onViewAll={() => go("learning")}
        onSelectModule={(mod) => {
          if (mod?.id && onOpenModule) onOpenModule(mod.id);
          else go("learning");
        }}
      />

      <AccessRequestsCard
        requests={pendingAccessRequests ?? []}
        childList={children}
      />

      <RecentActivityCard
        alerts={alertsForSelectedChild}
        childList={children}
      />

      <EmergencyCallModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={placeEmergencyCall}
      />
    </div>
  );
}
