"use client";

import { useState } from "react";
import { Sidebar } from "./components/sidebar";
import { OverviewTab } from "./components/overview-tab";
import { PlaceholderTab } from "./components/placeholder-tab";
import { placeholderTabLabels } from "./data/nav";

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("overview");
  const [selectedChild, setSelectedChild] = useState("sophia");

  const renderContent = () => {
    if (activeNav === "overview") return <OverviewTab />;
    const [title, subtitle] = placeholderTabLabels[activeNav] || ["Page", ""];
    return <PlaceholderTab title={title} subtitle={subtitle} />;
  };

  return (
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
  );
}
