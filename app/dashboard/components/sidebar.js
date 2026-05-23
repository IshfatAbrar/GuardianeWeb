import { children } from "../data/children";
import { sideNavItems } from "../data/nav";
import { sideHighlightItems } from "../data/nav";

export function Sidebar({
  activeNav,
  setActiveNav,
  selectedChild,
  setSelectedChild,
}) {
  return (
    <aside className="flex flex-col w-[280px] flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden">
      {/* My Children */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--muted)] mb-2.5 px-1">
          My Children
        </p>
        <div className="flex flex-col gap-1">
          {children.map((child) => {
            const isSelected = selectedChild === child.id;
            return (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-left transition-all ${
                  isSelected
                    ? "bg-[var(--accent-bg)] border border-[var(--accent-border)]"
                    : "bg-transparent border border-transparent hover:bg-[var(--surface-muted)]"
                }`}
              >
                {/* Avatar circle */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 border-2 ${
                    isSelected
                      ? "bg-[var(--surface)] border-[var(--accent-border)] text-[var(--accent)]"
                      : "bg-[var(--surface-muted)] border-[var(--border)] text-[var(--muted)]"
                  }`}
                >
                  {child.initials}
                </div>
                <span
                  className={`flex-1 text-[13px] font-medium leading-none ${
                    isSelected
                      ? "text-[var(--accent)]"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {child.name.split(" ")[0]}
                </span>
                {isSelected && (
                  <>
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
                    <svg
                      width="14" height="14"
                      fill="none"
                      style={{ stroke: "var(--accent)" }}
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      className="flex-shrink-0"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <path d="M14 14h3v3M17 20h3M20 17v3" />
                    </svg>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-4 my-3 h-px bg-[var(--border)]" />

      {/* Highlight nav */}
      <nav className="px-3 space-y-0.5">
        {sideHighlightItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-[var(--accent-bg)]"
                  : "hover:bg-[var(--surface-muted)]"
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
        })}
      </nav>

      <div className="mx-4 my-3 h-px bg-[var(--border)]" />

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {sideNavItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`relative flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all group ${
                isActive
                  ? "bg-[var(--accent-bg)]"
                  : "hover:bg-[var(--surface-muted)]"
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
        })}
      </nav>
    </aside>
  );
}