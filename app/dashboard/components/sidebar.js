"use client";

import { useState } from "react";
import { sideNavItems, sideHighlightItems } from "../data/nav";
import { childQrPayload } from "../../lib/database";
import { ChildQrModal } from "./child-qr-modal";

function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PanelIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </svg>
  );
}

export function Sidebar({
  activeNav,
  setActiveNav,
  childList = [],
  childrenLoading = false,
  selectedChildId,
  setSelectedChildId,
  collapsed = false,
  onToggleCollapsed,
}) {
  const [qrChild, setQrChild] = useState(null);

  return (
    <aside
      className={`flex flex-col flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[68px]" : "w-[280px]"
      }`}
    >
      {/* My Children */}
      <div className={collapsed ? "px-2 pt-2 pb-1" : "px-4 pt-2 pb-2"}>
        <div
          className={`flex items-center mb-3 mt-2 ${
            collapsed ? "justify-center" : "justify-between px-1"
          }`}
        >
          {!collapsed && (
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)]">
              My Children
            </p>
          )}
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
          >
            <PanelIcon />
          </button>
        </div>
        <div className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}>
          {childrenLoading ? (
            <ChildrenSkeleton collapsed={collapsed} />
          ) : childList.length === 0 ? (
            !collapsed && (
              <p className="px-3 py-2 text-[12px] text-[var(--muted)] italic">
                No children added yet.
              </p>
            )
          ) : (
            childList.map((child) => {
              const isSelected = selectedChildId === child.id;
              // The pairing payload is the child's document id, so every child
              // is always pairable — there is no stored qrCode field to await.
              const hasQr = !!childQrPayload(child);

              if (collapsed) {
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChildId(child.id)}
                    title={child.name || "Child"}
                    aria-label={child.name || "Child"}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 transition-all ${
                      isSelected
                        ? "bg-[var(--surface)] border-[var(--accent)] text-[var(--accent)]"
                        : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent-border)]"
                    }`}
                  >
                    {initialsFromName(child.name)}
                  </button>
                );
              }

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
      <nav className={`space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {sideHighlightItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeNav === item.id}
            collapsed={collapsed}
            onClick={() => setActiveNav(item.id)}
          />
        ))}
      </nav>

      <div className="my-3 h-px bg-[var(--border)]" />

      {/* Main nav */}
      <nav className={`flex-1 overflow-y-auto space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
        {sideNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeNav === item.id}
            collapsed={collapsed}
            onClick={() => setActiveNav(item.id)}
          />
        ))}
      </nav>

      <ChildQrModal
        open={!!qrChild}
        onClose={() => setQrChild(null)}
        childName={qrChild?.name}
        qrCode={qrChild ? childQrPayload(qrChild) : ""}
      />
    </aside>
  );
}

function NavButton({ item, isActive, onClick, collapsed }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      className={`relative flex items-center rounded-xl text-left transition-all group ${
        collapsed ? "justify-center w-full px-0 py-2.5" : "gap-3 w-full px-3 py-3"
      } ${isActive ? "bg-[var(--accent-bg)]" : "hover:bg-[var(--surface-muted)]"}`}
    >
      {isActive && !collapsed && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[var(--accent)]" />
      )}
      <span
        className={`flex-shrink-0 transition-colors ${
          isActive ? "text-[var(--accent)]" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
        }`}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span
          className={`flex-1 text-[13px] font-medium leading-none ${
            isActive ? "text-[var(--accent)]" : "text-[var(--foreground)]"
          }`}
        >
          {item.label}
        </span>
      )}
    </button>
  );
}

function ChildrenSkeleton({ collapsed }) {
  return (
    <>
      {[0, 1, 2].map((i) =>
        collapsed ? (
          <div key={i} className="w-9 h-9 rounded-full bg-[var(--surface-muted)] animate-pulse" />
        ) : (
          <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[var(--surface-muted)]" />
            <div className="h-3 flex-1 rounded bg-[var(--surface-muted)]" />
          </div>
        )
      )}
    </>
  );
}
