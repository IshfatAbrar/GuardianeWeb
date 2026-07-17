"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "./components/sidebar";
import { OverviewTab } from "./components/overview-tab";
import { PlaceholderTab } from "./components/placeholder-tab";
import { JojoChatTab } from "./components/jojo-chat-tab";
import { LearningTab } from "./components/learning-tab";
import { ModulesTab } from "./components/modules-tab";
import { MessagingTab } from "./components/messaging-tab";
import { EmergencyTab } from "./components/emergency-tab";
import { SettingsTab } from "./components/settings-tab";
import { placeholderTabLabels } from "./data/nav";
import { AuthGuard } from "../../components/auth-guard";
import { useDashboardData } from "./_lib/useDashboardData";

// "access" is intentionally absent — see the note in data/nav.js. A stale
// ?tab=access link now falls back to the overview rather than opening a tab
// that can never have anything in it.
const VALID_TABS = new Set([
  "overview",
  "messaging",
  "chatbot",
  "learning",
  "modules",
  "emergency",
  "settings",
]);

function userInitialFrom(profile, user) {
  const source =
    profile?.name || user?.displayName || user?.email || "";
  const first = source.trim()[0];
  return first ? first.toUpperCase() : "Y";
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = VALID_TABS.has(tabFromUrl) ? tabFromUrl : "overview";

  const [activeNav, setActiveNav] = useState(initialTab);
  const [pendingModuleId, setPendingModuleId] = useState(null);
  // Give the chat as much room as possible: the main sidebar starts collapsed
  // whenever the chatbot tab is open.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialTab === "chatbot");
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

  // Keep the active tab in sync with the URL (e.g. clicking the same Settings
  // link again, or a shared deep link). Adjusting state during render is the
  // documented pattern for syncing to a changing input — the equality guard
  // keeps it from looping. See https://react.dev/learn/you-might-not-need-an-effect
  const [lastSyncedTab, setLastSyncedTab] = useState(tabFromUrl);
  if (tabFromUrl !== lastSyncedTab) {
    setLastSyncedTab(tabFromUrl);
    if (VALID_TABS.has(tabFromUrl) && tabFromUrl !== activeNav) {
      setActiveNav(tabFromUrl);
    }
  }

  // Auto-collapse the main sidebar when entering the chatbot tab, and restore
  // it on the way out. Tracked on tab change (same during-render guard) so the
  // user can still manually toggle it while staying on a tab.
  const [lastCollapseTab, setLastCollapseTab] = useState(activeNav);
  if (activeNav !== lastCollapseTab) {
    setLastCollapseTab(activeNav);
    setSidebarCollapsed(activeNav === "chatbot");
  }

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
    if (activeNav === "messaging") return <MessagingTab data={data} />;
    if (activeNav === "modules") return <ModulesTab data={data} />;
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
      <div className="flex  flex-col overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            childList={data.children}
            childrenLoading={data.childrenLoading}
            selectedChildId={data.selectedChildId}
            setSelectedChildId={data.setSelectedChildId}
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
          />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto">{renderContent()}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
