"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./components/sidebar";
import { OverviewTab } from "./components/overview-tab";
import { PlaceholderTab } from "./components/placeholder-tab";
import { placeholderTabLabels } from "./data/nav";
import { AuthGuard } from "../../components/auth-guard";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [selectedChild, setSelectedChild] = useState("sophia");
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    console.log("[GUARDIANE-DB] dashboard: Firebase user →", user);
    console.log("[GUARDIANE-DB] dashboard: Firestore profile →", userProfile);
  }, [loading, user, userProfile]);

  const renderContent = () => {
    if (activeNav === "overview") return <OverviewTab />;
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
            selectedChild={selectedChild}
            setSelectedChild={setSelectedChild}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto">{renderContent()}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
