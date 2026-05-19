import { modules, moduleColors } from "../data/modules";

export function LearningModulesCarousel() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent-bg)] flex items-center justify-center">
          <svg
            width="18"
            height="18"
            fill="none"
            style={{ stroke: "var(--accent)" }}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-[18px] font-bold text-[var(--foreground)]">
          Learning Modules
        </h2>
        <button className="ml-auto text-[13px] font-semibold text-[var(--accent)] bg-[var(--accent-bg)] px-3 py-1 rounded-lg hover:bg-[var(--accent-bg-hover)] transition-colors">
          View All
        </button>
      </div>

      <div
        className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {modules.map((mod, i) => {
          const color = moduleColors[i % moduleColors.length];
          return (
            <div
              key={mod.id}
              className="flex-shrink-0 w-[200px] rounded-2xl p-4 flex flex-col gap-3 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: color.bg }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
                    style={{ background: color.badge }}
                  >
                    Custom
                  </span>
                  <span
                    className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
                    style={{ background: color.badge }}
                  >
                    Parent
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <p className="text-[17px] font-bold text-white leading-tight">
                  {mod.name}
                </p>
                <p className="text-[12px] text-white opacity-80 mt-0.5">
                  {mod.child}
                </p>
              </div>

              {/* Bottom row */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((d) => (
                    <div
                      key={d}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          d === 0 ? "white" : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <svg
                    width="13"
                    height="13"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect x="8" y="2" width="8" height="4" rx="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  </svg>
                  <span className="text-[12px] font-semibold text-white">
                    {mod.lessons}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
