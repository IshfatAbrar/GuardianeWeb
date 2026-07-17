"use client";

// Crisis management.
//
// This used to read a `safety_incidents` collection. Nothing in the Android
// schema writes that — it is empty in the live project — so the incident feed
// could only ever show zero. Two real sources replaced it:
//   • emergency contacts  → `emergency_contacts`, which the child app reads
//   • risk alerts         → `messages` rows the child's classifier flagged
//                           (data.alerts, already merged by useDashboardData)

import { useEffect, useMemo, useState } from "react";
import { listenToEmergencyContacts } from "../../lib/emergencyContacts";
import { EmergencyContactsCard } from "./emergency-contacts-card";
import { EmergencyContactFormModal } from "./emergency-contact-form-modal";
import { EmergencyCallModal } from "./emergency-call-modal";
import { LiveChatModal } from "./live-chat-modal";

// Was iOS's AlertCenterViewModel.escalationChain, previously re-exported from
// the deleted safetyIncidents module. It is static presentation — nothing
// drives or persists it.
const DEFAULT_ESCALATION_CHAIN = [
  { level: 1, role: "AI Detection", active: true },
  { level: 2, role: "Guardian Notified", active: true },
  { level: 3, role: "Service Provider", active: false },
];

const SEVERITY_META = {
  critical: { label: "Critical", color: "#EF4444", bg: "rgba(239, 68, 68, 0.16)" },
  warning: { label: "Warning", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.16)" },
  info: { label: "Info", color: "#3B82F6", bg: "rgba(59, 130, 246, 0.16)" },
};

function relativeTime(ts) {
  const ms = ts?.toMillis?.();
  if (typeof ms !== "number") return "—";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
        active
          ? "bg-rose-500 text-white"
          : "bg-[var(--surface-muted)] text-[var(--muted)]"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function EmergencyStatusCard({ activeSOS, criticalCount, onCall }) {
  return (
    <SectionCard
      className={activeSOS ? "border-rose-500/40" : ""}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h2 className="text-[15px] font-semibold tracking-tight text-[#EF4444]">
            Emergency Status
          </h2>
        </div>
        <StatusPill active={activeSOS} />
      </div>

      <div className="my-4 h-px w-full bg-[var(--border)]" />

      {activeSOS ? (
        <div className="space-y-3">
          <p className="text-[13px] font-semibold text-rose-500">
            {criticalCount === 1
              ? "Active Emergency Detected"
              : `${criticalCount} Active Emergencies Detected`}
          </p>
          <p className="text-[12.5px] text-[var(--muted)]">
            An AI-flagged critical event requires your review. Contact emergency
            services if needed.
          </p>
          <button
            type="button"
            onClick={onCall}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-rose-600"
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Call Emergency Services
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <svg width="14" height="14" fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p className="text-[13px] text-[var(--foreground)]">
            No active emergencies detected
          </p>
        </div>
      )}
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
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
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
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
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
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          }
        />
      </div>
    </SectionCard>
  );
}

function EscalationStep({ step }) {
  const isActive = step.active;
  const ring = isActive ? "var(--accent)" : "var(--muted)";
  const numberColor = isActive ? "var(--accent)" : "var(--muted)";
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isActive ? "bg-[var(--accent-bg)]" : "bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-semibold"
        style={{ borderColor: ring, color: numberColor }}
      >
        {step.level}
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-[var(--foreground)]">
          {step.role}
        </p>
        <p className="text-[12px] text-[var(--muted)]">
          {isActive ? "Pending response" : "Standby"}
        </p>
      </div>
      {isActive && (
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
      )}
    </div>
  );
}

function EscalationProtocol({ steps }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          Escalation Protocol
        </h2>
        <button
          type="button"
          className="text-[12px] font-semibold text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Customize
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {steps.map((s) => (
          <EscalationStep key={s.level} step={s} />
        ))}
      </div>
    </SectionCard>
  );
}

function RiskAlertItem({ alert, childName, isLast }) {
  const meta = SEVERITY_META[alert.severity] ?? SEVERITY_META.info;
  return (
    <li
      className={`flex items-start gap-3 px-4 py-3 ${
        isLast ? "" : "border-b border-[var(--border)]"
      }`}
    >
      <span
        className="mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        {meta.label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--foreground)]">{alert.type}</p>
        {/* The child app composes a long "Risk detected: X (0.92): SMS: ..."
            line; clamp it rather than letting one alert dominate the card. */}
        <p className="line-clamp-2 text-[11.5px] text-[var(--muted)]">{alert.message}</p>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
          {[childName, relativeTime(alert.timestamp)].filter(Boolean).join(" · ")}
        </p>
      </div>
    </li>
  );
}

function RecentRiskAlerts({ alerts, childById }) {
  return (
    <SectionCard className="p-0">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-[14px] font-bold text-[var(--foreground)]">Risk alerts</h2>
        <p className="text-[11.5px] text-[var(--muted)]">
          Flagged on your child&apos;s device by on-device analysis
        </p>
      </div>
      {alerts.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-[var(--muted)]">
          No risk alerts.
        </p>
      ) : (
        <ul>
          {alerts.map((a, i) => (
            <RiskAlertItem
              key={a.id}
              alert={a}
              childName={childById.get(a.childId)?.name}
              isLast={i === alerts.length - 1}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function EmergencyTab({ data }) {
  const user = data?.user || null;
  const parentUid = user?.uid || null;
  const childList = useMemo(() => data?.children || [], [data?.children]);
  const childById = useMemo(() => {
    const m = new Map();
    for (const c of childList) m.set(c.id, c);
    return m;
  }, [childList]);

  const alerts = useMemo(() => data?.alerts || [], [data?.alerts]);
  const activeAlerts = useMemo(() => data?.activeAlerts || [], [data?.activeAlerts]);
  const critical = useMemo(
    () => activeAlerts.filter((a) => a.severity === "critical"),
    [activeAlerts],
  );
  const activeSOS = critical.length > 0;

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [callOpen, setCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [formContact, setFormContact] = useState(null); // contact being edited
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (!parentUid) return undefined;
    return listenToEmergencyContacts(parentUid, (rows) => {
      setContacts(rows);
      setContactsLoading(false);
    });
  }, [parentUid]);

  function placeEmergencyCall() {
    if (typeof window !== "undefined") {
      window.location.href = "tel:911";
    }
  }

  function openAdd() {
    setFormContact(null);
    setFormOpen(true);
  }

  function openEdit(contact) {
    setFormContact(contact);
    setFormOpen(true);
  }

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
      </div>

      <div className="h-px w-full bg-[var(--border)]" />

      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EmergencyStatusCard
            activeSOS={activeSOS}
            criticalCount={critical.length}
            onCall={() => setCallOpen(true)}
          />
          <EmergencyActions
            onBeacon={() => {}}
            onChat={() => setChatOpen(true)}
            onCall={() => setCallOpen(true)}
          />

          <EmergencyContactsCard
            contacts={contacts}
            loading={contactsLoading}
            onAdd={openAdd}
            onEdit={openEdit}
          />
          <RecentRiskAlerts alerts={alerts} childById={childById} />

          <EscalationProtocol steps={DEFAULT_ESCALATION_CHAIN} />
        </div>
      </div>

      <EmergencyCallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        onConfirm={placeEmergencyCall}
      />
      <LiveChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
      <EmergencyContactFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        parentUid={parentUid}
        contact={formContact}
      />
    </div>
  );
}
