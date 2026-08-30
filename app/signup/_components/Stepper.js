import { STEPS } from "../_lib/constants";

export function Stepper({ current }) {
  return (
    <div className="border-b border-[var(--border)] pt-7 ">
      <div className="flex items-baseline justify-between gap-3 pb-3">
        {STEPS.map((s, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div
              key={s.label}
              className={`flex-1 truncate text-center text-[0.78rem] transition-colors ${
                active
                  ? "font-semibold text-[var(--accent)]"
                  : done
                    ? "font-medium text-[var(--foreground)]"
                    : "font-medium text-[var(--muted)]"
              }`}
            >
              {i + 1}. {s.label}
            </div>
          );
        })}
      </div>
      <div className="flex w-full">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 transition-colors duration-300 ${
              i <= current ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
