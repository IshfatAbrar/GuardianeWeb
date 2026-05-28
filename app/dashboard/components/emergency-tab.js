"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listenToSafetyIncidents,
  markIncidentResolved,
  severityFor,
  isCritical,
  isHighRisk,
  formatRelativeTime,
  SEVERITY,
  SAFETY_CLASS,
  DEFAULT_ESCALATION_CHAIN,
} from "../../lib/safetyIncidents";
import { EmergencyCallModal } from "./emergency-call-modal";
import { LiveChatModal } from "./live-chat-modal";

const SEVERITY_META = {
  [SEVERITY.CRITICAL]: { label: "Critical", color: "#EF4444", bg: "rgba(239, 68, 68, 0.16)" },
  [SEVERITY.HIGH]: { label: "High", color: "#F97316", bg: "rgba(249, 115, 22, 0.16)" },
  [SEVERITY.MEDIUM]: { label: "Medium", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.16)" },
  [SEVERITY.LOW]: { label: "Low", color: "#10B981", bg: "rgba(16, 185, 129, 0.16)" },
};

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

function AlertItem({ incident, childName, onResolve }) {
  const severity = severityFor(incident);
  const meta = SEVERITY_META[severity];
  const critical = isCritical(incident);
  const highRisk = isHighRisk(incident);
  const className = incident.safetyClass || "Alert";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${
        critical
          ? "border-rose-500/40 bg-rose-500/5"
          : "border-[var(--border)] bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] font-semibold text-[var(--foreground)]">
            {className}
          </p>
          <span className="whitespace-nowrap text-[11px] text-[var(--muted)]">
            {formatRelativeTime(incident.firestoreTimestamp)}
          </span>
        </div>
        {childName && (
          <p className="mt-0.5 text-[11.5px] text-[var(--muted)]">
            {childName}
          </p>
        )}
        {incident.message && (
          <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-[var(--foreground)]">
            “{incident.message}”
          </p>
        )}
        {incident.explanation && (
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
            {incident.explanation}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
            {highRisk && (
              <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-rose-500">
                High risk
              </span>
            )}
            {typeof incident.confidence === "number" && (
              <span className="text-[11px] text-[var(--muted)]">
                {(incident.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
            {incident.wasBlocked && (
              <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-500">
                Blocked
              </span>
            )}
          </div>
          {!incident.isResolved ? (
            <button
              type="button"
              onClick={onResolve}
              className="text-[11.5px] font-semibold text-[var(--accent)] hover:underline"
            >
              Mark as resolved
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14.5-4-4 1.5-1.5 2.5 2.5 5.5-5.5 1.5 1.5z" />
              </svg>
              Resolved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AllAlerts({ incidents, childById, onResolve }) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
          All Alerts
        </h2>
        <span className="text-[12px] text-[var(--muted)]">
          {incidents.length} {incidents.length === 1 ? "alert" : "alerts"}
        </span>
      </div>
      {incidents.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-[var(--surface-muted)] py-10 text-center">
          <svg width="40" height="40" fill="none" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <div className="space-y-0.5">
            <p className="text-[14px] font-semibold text-[var(--foreground)]">
              No Alerts
            </p>
            <p className="text-[12px] text-[var(--muted)]">
              No alerts from child app at this time.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {incidents.map((incident) => (
            <AlertItem
              key={incident.id}
              incident={incident}
              childName={childById.get(incident.childId)?.name}
              onResolve={() => onResolve(incident.id)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function EmergencyTab({ data }) {
  const childList = useMemo(() => data?.children || [], [data?.children]);
  const childIds = useMemo(() => childList.map((c) => c.id), [childList]);
  const childById = useMemo(() => {
    const m = new Map();
    for (const c of childList) m.set(c.id, c);
    return m;
  }, [childList]);

  const [incidents, setIncidents] = useState([]);
  const [listenerErr, setListenerErr] = useState(null);
  const [callOpen, setCallOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Subscribe to the safety_incidents collection, filtered to this family's
  // children only. Wait for `data.children` to arrive before subscribing to
  // avoid a first-paint "no alerts" flash before the filter is known.
  useEffect(() => {
    if (!data?.children) return undefined;
    const unsub = listenToSafetyIncidents({
      familyChildIds: childIds,
      onUpdate: (rows) => {
        setIncidents(rows);
        setListenerErr(null);
      },
      onError: (err) =>
        setListenerErr(err.message || "Failed to load safety incidents"),
    });
    return unsub;
  }, [data?.children, childIds]);

  const unresolved = useMemo(
    () => incidents.filter((i) => !i.isResolved),
    [incidents],
  );
  const critical = useMemo(
    () => unresolved.filter((i) => isCritical(i)),
    [unresolved],
  );
  const activeSOS = critical.length > 0;

  function handleResolve(id) {
    markIncidentResolved(id).catch((err) =>
      setListenerErr(err.message || "Failed to mark resolved"),
    );
  }

  function placeEmergencyCall() {
    if (typeof window !== "undefined") {
      window.location.href = "tel:911";
    }
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
        {listenerErr && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-4 text-[12.5px] text-[var(--danger)]">
            {listenerErr}
          </div>
        )}

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <EscalationProtocol steps={DEFAULT_ESCALATION_CHAIN} />
          <AllAlerts
            incidents={incidents}
            childById={childById}
            onResolve={handleResolve}
          />
        </div>
      </div>

      <EmergencyCallModal
        open={callOpen}
        onClose={() => setCallOpen(false)}
        onConfirm={placeEmergencyCall}
      />
      <LiveChatModal open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
