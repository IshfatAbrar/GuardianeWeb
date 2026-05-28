"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { OverviewTab } from "./components/overview-tab";
import { PlaceholderTab } from "./components/placeholder-tab";
import { JojoChatTab } from "./components/jojo-chat-tab";
import { LearningTab } from "./components/learning-tab";
import { ModulesTab } from "./components/modules-tab";
import { AccessTab } from "./components/access-tab";
import { EmergencyTab } from "./components/emergency-tab";
import { SettingsTab } from "./components/settings-tab";
import { placeholderTabLabels } from "./data/nav";
import { AuthGuard } from "../../components/auth-guard";
import { useDashboardData } from "./_lib/useDashboardData";

const VALID_TABS = new Set([
  "overview",
  "chatbot",
  "learning",
  "modules",
  "access",
  "emergency",
  "settings",
]);

function userInitialFrom(profile, user) {
  const source =
    profile?.fullName || user?.displayName || user?.email || "";
  const first = source.trim()[0];
  return first ? first.toUpperCase() : "Y";
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = VALID_TABS.has(tabFromUrl) ? tabFromUrl : "overview";

  const [activeNav, setActiveNav] = useState(initialTab);
  const [pendingModuleId, setPendingModuleId] = useState(null);
  const data = useDashboardData();

  // Sync the URL ?tab= when the user clicks around. replaceState (not push)
  // so the browser-back button still leaves the dashboard rather than walking
  // through every tab the user happened to click on.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (activeNav === "overview") params.delete("tab");
    else params.set("tab", activeNav);
    const qs = params.toString();
    const next = qs ? `/dashboard?${qs}` : "/dashboard";
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [activeNav]);

  // If the user clicks the same Settings link a second time (URL→state).
  useEffect(() => {
    if (VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeNav) {
      setActiveNav(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const openLearningModule = (moduleId) => {
    setPendingModuleId(moduleId);
    setActiveNav("learning");
  };

  const renderContent = () => {
    if (activeNav === "overview")
      return (
        <OverviewTab
          data={data}
          onNavigate={setActiveNav}
          onOpenModule={openLearningModule}
        />
      );
    if (activeNav === "chatbot") {
      return (
        <JojoChatTab userInitial={userInitialFrom(data.userProfile, data.user)} />
      );
    }
    if (activeNav === "learning")
      return (
        <LearningTab
          data={data}
          initialModuleId={pendingModuleId}
          onInitialModuleConsumed={() => setPendingModuleId(null)}
        />
      );
    if (activeNav === "modules") return <ModulesTab data={data} />;
    if (activeNav === "access") return <AccessTab data={data} />;
    if (activeNav === "emergency") return <EmergencyTab data={data} />;
    if (activeNav === "settings") return <SettingsTab data={data} />;
    const [title, subtitle] = placeholderTabLabels[activeNav] || ["Page", ""];
    return <PlaceholderTab title={title} subtitle={subtitle} />;
  };

  return (
    <AuthGuard
      mode="protected"
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            childList={data.children}
            childrenLoading={data.childrenLoading}
            selectedChildId={data.selectedChildId}
            setSelectedChildId={data.setSelectedChildId}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto">{renderContent()}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
