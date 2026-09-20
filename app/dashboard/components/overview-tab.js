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
import { MoodAnalyticsModal } from "./mood-analytics-modal";
import { AppLimitsModal } from "./app-limits-modal";
import { ScreenTimeLimitModal } from "./screen-time-limit-modal";

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
  } = data;

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [appLimitsOpen, setAppLimitsOpen] = useState(false);
  const [screenTimeLimitOpen, setScreenTimeLimitOpen] = useState(false);

  const greetingName = firstName(userProfile, user);
  const selectedChild = children.find((c) => c.id === selectedChildId) ?? null;

  const go = (tab) => onNavigate?.(tab);
  const openReport = () => {
    if (selectedChild) setReportOpen(true);
  };

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
        />
        <QuickActionsCard
          onReports={openReport}
          onMessages={() => go("messaging")}
          onEmergency={() => setEmergencyOpen(true)}
          onAppLimits={() => setAppLimitsOpen(true)}
          onScreenTimeLimit={() => setScreenTimeLimitOpen(true)}
          onAssignModule={() => go("modules")}
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

      <RecentActivityCard
        alerts={alertsForSelectedChild}
        childList={children}
      />

      <EmergencyCallModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={placeEmergencyCall}
      />

      <MoodAnalyticsModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        child={selectedChild}
      />

      <AppLimitsModal
        open={appLimitsOpen}
        onClose={() => setAppLimitsOpen(false)}
        childList={children}
        initialChildId={selectedChildId}
      />

      <ScreenTimeLimitModal
        open={screenTimeLimitOpen}
        onClose={() => setScreenTimeLimitOpen(false)}
        childList={children}
        initialChildId={selectedChildId}
      />
    </div>
  );
}
