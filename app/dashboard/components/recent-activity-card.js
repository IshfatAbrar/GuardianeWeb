import { TitleIcon } from "../../../components/title-icon";

const SEVERITY_DOT = {
  critical: "bg-[var(--danger)]",
  error: "bg-[var(--danger)]",
  warning: "bg-amber-500",
  info: "bg-[var(--accent)]",
};

function relativeTime(ts) {
  if (!ts?.toDate) return "";
  const then = ts.toDate().getTime();
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return ts.toDate().toLocaleDateString();
}

function childNameFor(alert, childList) {
  if (!alert?.childId || !childList?.length) return null;
  return childList.find((c) => c.id === alert.childId)?.name ?? null;
}

export function RecentActivityCard({ alerts = [], childList = [] }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <TitleIcon>
          <svg
            width="18"
            height="18"
            fill="var(--accent)"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
          </svg>
        </TitleIcon>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          Recent Activity
        </h2>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] flex items-center justify-center">
            <svg
              width="20"
              height="20"
              fill="none"
              style={{ stroke: "var(--muted)" }}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[14px] text-[var(--muted)]">No recent alerts</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {alerts.map((a) => {
            const dot = SEVERITY_DOT[a.severity] ?? "bg-[var(--muted)]";
            const childName = childNameFor(a, childList);
            return (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <span
                  className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dot}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--foreground)]">
                    {a.type || a.message || "Alert"}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {[childName, relativeTime(a.timestamp)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {a.status && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {a.status}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
