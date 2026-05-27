"use client";

import { useState } from "react";
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

function userInitialFrom(profile, user) {
  const source =
    profile?.fullName || user?.displayName || user?.email || "";
  const first = source.trim()[0];
  return first ? first.toUpperCase() : "Y";
}

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const data = useDashboardData();

  const renderContent = () => {
    if (activeNav === "overview") return <OverviewTab data={data} />;
    if (activeNav === "chatbot") {
      return (
        <JojoChatTab userInitial={userInitialFrom(data.userProfile, data.user)} />
      );
    }
    if (activeNav === "learning") return <LearningTab />;
    if (activeNav === "modules") return <ModulesTab />;
    if (activeNav === "access") return <AccessTab />;
    if (activeNav === "emergency") return <EmergencyTab />;
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
