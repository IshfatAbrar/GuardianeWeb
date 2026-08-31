"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
import { CriticalAlertPopup } from "./components/critical-alert-popup";
import { placeholderTabLabels } from "./data/nav";
import { AuthGuard } from "../../components/auth-guard";
import { useDashboardData } from "./_lib/useDashboardData";
import { useModuleCompletionAlerts } from "./_lib/useModuleCompletionAlerts";
import { useNotifications } from "../lib/useNotifications";

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
  const source = profile?.name || user?.displayName || user?.email || "";
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
  // whenever the chatbot or messaging tab is open.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    initialTab === "chatbot" || initialTab === "messaging",
  );
  const data = useDashboardData();
  const { alerts: unreadAlerts } = useNotifications();

  const childById = useMemo(() => {
    const m = new Map();
    for (const c of data.children) m.set(c.id, c);
    return m;
  }, [data.children]);
  const moduleById = useMemo(() => {
    const m = new Map();
    for (const mod of data.modules) m.set(mod.id, mod);
    return m;
  }, [data.modules]);
  const {
    unseenCount: moduleCompletionsUnseen,
    markAllSeen: markModuleCompletionsSeen,
  } = useModuleCompletionAlerts({
    parentId: data.user?.uid,
    assignments: data.assignments,
    progressById: data.progressById,
    childById,
    moduleById,
    ready: data.moduleCompletionDataReady,
  });

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

  // Same one-way URL→state sync, for `?child=<id>` — set by the header's
  // dashboard search (components/site-header.js) so picking a child result
  // there switches the dashboard's selected child without changing tabs.
  const childFromUrl = searchParams.get("child");
  const [lastSyncedChild, setLastSyncedChild] = useState(childFromUrl);
  if (childFromUrl !== lastSyncedChild) {
    setLastSyncedChild(childFromUrl);
    if (childFromUrl) data.setSelectedChildId(childFromUrl);
  }

  // Same again for `?module=<id>` — the header search's module results pair
  // this with `?tab=learning`, and pendingModuleId is the same "open this
  // module" request openLearningModule() already feeds to LearningTab below.
  const moduleFromUrl = searchParams.get("module");
  const [lastSyncedModule, setLastSyncedModule] = useState(moduleFromUrl);
  if (moduleFromUrl !== lastSyncedModule) {
    setLastSyncedModule(moduleFromUrl);
    if (moduleFromUrl) setPendingModuleId(moduleFromUrl);
  }

  // Auto-collapse the main sidebar when entering the chatbot or messaging
  // tab, and restore it on the way out. Tracked on tab change (same
  // during-render guard) so the user can still manually toggle it while
  // staying on a tab.
  const [lastCollapseTab, setLastCollapseTab] = useState(activeNav);
  if (activeNav !== lastCollapseTab) {
    setLastCollapseTab(activeNav);
    setSidebarCollapsed(activeNav === "chatbot" || activeNav === "messaging");
    // Clear the Module Assignments badge the moment the parent opens that tab.
    if (activeNav === "modules") markModuleCompletionsSeen();
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
        <JojoChatTab
          userInitial={userInitialFrom(data.userProfile, data.user)}
        />
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
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
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
            badges={{
              messaging: data.unreadMessagesCount,
              emergency: data.activeAlerts.length,
              modules: moduleCompletionsUnseen,
            }}
          />
          <main className="flex flex-1 flex-col overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>

      <CriticalAlertPopup
        alerts={unreadAlerts}
        childList={data.children}
        onGoToEmergency={(childId) => {
          // Crisis Management now scopes its Risk alerts card to the selected
          // child — jump to the alert's own child first, or landing on the
          // tab could show a different child's (non-critical) alerts instead
          // of the one that triggered this popup.
          if (childId) data.setSelectedChildId(childId);
          setActiveNav("emergency");
        }}
      />
    </AuthGuard>
  );
}
