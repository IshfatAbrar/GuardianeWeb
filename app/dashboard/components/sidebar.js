"use client";

import { useState } from "react";
import { sideNavItems, sideHighlightItems } from "../data/nav";
import { ChildQrModal } from "./child-qr-modal";

function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar({
  activeNav,
  setActiveNav,
  childList = [],
  childrenLoading = false,
  selectedChildId,
  setSelectedChildId,
}) {
  const [qrChild, setQrChild] = useState(null);

  return (
    <aside className="flex flex-col w-[280px] flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden">
      {/* My Children */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)] mb-2.5 px-1">
          My Children
        </p>
        <div className="flex flex-col gap-1">
          {childrenLoading ? (
            <ChildrenSkeleton />
          ) : childList.length === 0 ? (
            <p className="px-3 py-2 text-[12px] text-[var(--muted)] italic">
              No children added yet.
            </p>
          ) : (
            childList.map((child) => {
              const isSelected = selectedChildId === child.id;
              const hasQr = typeof child.qrCode === "string" && child.qrCode.length > 0;
              return (
                <div
                  key={child.id}
                  className={`flex items-center w-full rounded-xl transition-all ${
                    isSelected
                      ? "bg-[var(--accent-bg)] border border-[var(--accent-border)]"
                      : "bg-transparent border border-transparent hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <button
                    onClick={() => setSelectedChildId(child.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2 text-left"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 ${
                        isSelected
                          ? "bg-[var(--surface)] border-[var(--accent-border)] text-[var(--accent)]"
                          : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {initialsFromName(child.name)}
                    </div>
                    <span
                      className={`flex-1 truncate text-[13px] font-medium leading-none ${
                        isSelected
                          ? "text-[var(--accent)]"
                          : "text-[var(--foreground)]"
                      }`}
                    >
                      {child.name?.split(" ")[0] || "Child"}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                        <svg
                          width="8" height="8"
                          fill="none" stroke="white"
                          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                  {hasQr && (
                    <button
                      type="button"
                      onClick={() => setQrChild(child)}
                      aria-label={`Show QR code for ${child.name || "child"}`}
                      title="Show registration QR code"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mr-1.5 text-[var(--accent)] transition-colors hover:bg-[var(--accent-bg)]"
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h3v3h-3zM20 14v3M14 20h3v1M17 17v3M21 17v4" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="my-3 h-px bg-[var(--border)]" />

      {/* Highlight nav */}
      <nav className="px-3 space-y-0.5">
        {sideHighlightItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeNav === item.id}
            onClick={() => setActiveNav(item.id)}
          />
        ))}
      </nav>

      <div className="my-3 h-px bg-[var(--border)]" />

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {sideNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeNav === item.id}
            onClick={() => setActiveNav(item.id)}
          />
        ))}
      </nav>

      <ChildQrModal
        open={!!qrChild}
        onClose={() => setQrChild(null)}
        childName={qrChild?.name}
        qrCode={qrChild?.qrCode}
      />
    </aside>
  );
}

function NavButton({ item, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all group ${
        isActive ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--surface-muted)]"
      }`}
    >
      {isActive && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[var(--accent)]" />
      )}
      <span
        className={`flex-shrink-0 transition-colors ${
          isActive ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
        }`}
      >
        {item.icon}
      </span>
      <span
        className={`flex-1 text-[13px] font-medium leading-none ${
          isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"
        }`}
      >
        {item.label}
      </span>
      {item.badge && (
        <span className="flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[8px] font-semibold text-white">
          {item.badge}
        </span>
      )}
    </button>
  );
}

function ChildrenSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)]" />
          <div className="h-3 flex-1 rounded bg-[var(--surface-muted)]" />
        </div>
      ))}
    </>
  );
}
