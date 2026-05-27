"use client";

import { useState } from "react";

const SEED_ALERTS = [
  {
    id: "al1",
    title: "Cyberbullying",
    body: "Potential cyberbullying in group chat — 'nobody wants you here'",
    tag: "Behavior",
    tagColor: "#EF4444",
    ageLabel: "2d ago",
    isNew: true,
  },
  {
    id: "al2",
    title: "Late-night activity",
    body: "Unusual screen time detected after 11 PM on three consecutive nights.",
    tag: "Usage",
    tagColor: "#F59E0B",
    ageLabel: "4d ago",
    isNew: false,
  },
  {
    id: "al3",
    title: "Unknown contact",
    body: "New unknown contact attempted to message Lily on Discord.",
    tag: "Contact",
    tagColor: "#A855F7",
    ageLabel: "5d ago",
    isNew: false,
  },
];

const ESCALATION = [
  { id: 1, label: "AI Detection", status: "Pending response", state: "active" },
  { id: 2, label: "Guardian Notified", status: "Pending response", state: "active" },
  { id: 3, label: "Service Provider", status: "Standby", state: "idle" },
];

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function EmergencyStatusCard({ active }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#EF4444]">
            Emergency Status
          </h2>
        </div>
        <span
          className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]"
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[var(--surface-muted)] px-4 py-3">
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.18)" }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-[13px] text-[var(--foreground)]">
          No active emergencies detected
        </p>
      </div>
    </SectionCard>
  );
}

function ActionTile({ label, color, bg, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-[var(--surface-muted)]"
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: bg, color }}
      >
        {icon}
      </span>
      <span className="text-[13px] font-medium text-[var(--foreground)]">
        {label}
      </span>
    </button>
  );
}

function EmergencyActions({ onBeacon, onChat, onCall }) {
  return (
    <SectionCard>
      <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
        Emergency Actions
      </h2>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionTile
          label="Beacon"
          color="#F59E0B"
          bg="rgba(245, 158, 11, 0.18)"
          onClick={onBeacon}
          icon={
            <svg
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
            </svg>
          }
        />
        <ActionTile
          label="Live Chat"
          color="#3B82F6"
          bg="rgba(59, 130, 246, 0.18)"
          onClick={onChat}
          icon={
            <svg
              width="22"
              height="22"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <ActionTile
          label="Emergency Call"
          color="#EF4444"
          bg="rgba(239, 68, 68, 0.18)"
          onClick={onCall}
          icon={
            <svg
              width="22"
              height="22"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
      </div>
    </SectionCard>
  );
}

function EscalationStep({ step }) {
  const isActive = step.state === "active";
  const ring = isActive ? "#3B82F6" : "var(--muted)";
  const numberColor = isActive ? "#3B82F6" : "var(--muted)";
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isActive
          ? "bg-[rgba(59,130,246,0.06)]"
          : "bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-semibold"
        style={{ borderColor: ring, color: numberColor }}
      >
        {step.id}
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-[var(--foreground)]">
          {step.label}
        </p>
        <p className="text-[12px] text-[var(--muted)]">{step.status}</p>
      </div>
      {isActive && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "#3B82F6" }}
        />
      )}
    </div>
  );
}

function EscalationProtocol({ steps, onCustomize }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          Escalation Protocol
        </h2>
        <button
          type="button"
          onClick={onCustomize}
          className="text-[12px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Customize
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {steps.map((s) => (
          <EscalationStep key={s.id} step={s} />
        ))}
      </div>
    </SectionCard>
  );
}

function AlertItem({ alert }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "rgba(239, 68, 68, 0.16)" }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-semibold text-[var(--foreground)]">
            {alert.title}
          </p>
          <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
            {alert.ageLabel}
          </span>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--muted)]">
          {alert.body}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
            style={{
              backgroundColor: `${alert.tagColor}22`,
              color: alert.tagColor,
            }}
          >
            {alert.tag}
          </span>
          {alert.isNew && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EF4444]">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#EF4444" }}
              />
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AllAlerts({ alerts }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          All Alerts
        </h2>
        <span className="text-[12px] text-[var(--muted)]">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {alerts.map((a) => (
          <AlertItem key={a.id} alert={a} />
        ))}
      </div>
    </SectionCard>
  );
}

export function EmergencyTab() {
  const [alerts] = useState(SEED_ALERTS);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Crisis Management
          </h1>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
            Emergency Response System
          </p>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
        >
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
          </svg>
        </button>
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="flex flex-col gap-4 p-6">
        <EmergencyStatusCard active={false} />
        <EmergencyActions
          onBeacon={() => {}}
          onChat={() => {}}
          onCall={() => {}}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EscalationProtocol steps={ESCALATION} onCustomize={() => {}} />
          <AllAlerts alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
