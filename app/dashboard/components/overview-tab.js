"use client";

import { useState } from "react";
import { JojoBanner } from "./jojo-banner";
import { StatsGrid } from "./stats-grid";
import { TodaysMoodCard } from "./todays-mood-card";
import { QuickActionsCard } from "./quick-actions-card";
import { LearningModulesCarousel } from "./learning-modules-carousel";
import { RecentActivityCard } from "./recent-activity-card";
import { ChildFormModal } from "./child-form-modal";
import { EmergencyCallModal } from "./emergency-call-modal";
import { MoodReportModal } from "./mood-report-modal";

function firstName(profile, user) {
  const full = profile?.fullName || user?.displayName || "";
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
    familyId,
    children,
    alerts,
    activeAlerts,
    modules,
    todaysMood,
    completedAssignmentsCount,
    inProgressAssignmentsCount,
    selectedChildId,
  } = data;

  const [addChildOpen, setAddChildOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

      <JojoBanner onTalk={() => go("chatbot")} onLearnMore={() => go("chatbot")} />

      <StatsGrid
        childrenCount={children.length}
        activeAlertsCount={activeAlerts.length}
        completedCount={completedAssignmentsCount}
        inProgressCount={inProgressAssignmentsCount}
      />

      <div className="grid grid-cols-2 gap-4 pt-2">
        <TodaysMoodCard
          mood={todaysMood}
          childName={selectedChild?.name}
          onFullReport={openReport}
        />
        <QuickActionsCard
          onAddChild={() => setAddChildOpen(true)}
          onReports={openReport}
          onMessages={() => go("chatbot")}
          onEmergency={() => setEmergencyOpen(true)}
        />
      </div>

      <LearningModulesCarousel
        modules={modules}
        onViewAll={() => go("learning")}
        onSelectModule={(mod) => {
          if (mod?.id && onOpenModule) onOpenModule(mod.id);
          else go("learning");
        }}
      />

      <RecentActivityCard alerts={alerts} childList={children} />

      <ChildFormModal
        open={addChildOpen}
        onClose={() => setAddChildOpen(false)}
        parentUid={user?.uid}
        familyId={familyId}
      />

      <EmergencyCallModal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={placeEmergencyCall}
      />

      <MoodReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        child={selectedChild}
      />
    </div>
  );
}
