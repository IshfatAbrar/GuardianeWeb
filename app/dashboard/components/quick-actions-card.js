import { quickActions } from "../data/nav";

export function QuickActionsCard({
  onAddChild,
  onReports,
  onMessages,
  onEmergency,
}) {
  const handlers = {
    addChild: onAddChild,
    reports: onReports,
    messages: onMessages,
    emergency: onEmergency,
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg
            width="18"
            height="18"
            style={{ fill: "var(--accent)" }}
            viewBox="0 0 24 24"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {quickActions.map((qa) => (
          <button
            key={qa.id}
            type="button"
            onClick={handlers[qa.id]}
            className="flex flex-col items-center gap-2.5 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center group-hover:bg-[var(--accent-bg-hover)] transition-colors">
              {qa.icon}
            </div>
            <span className="text-[12px] font-medium text-[var(--foreground)] text-center leading-tight">
              {qa.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
