import { Trash2 } from "lucide-react";
import { getAge, getInitials } from "../_lib/helpers";

export function ChildCard({ child, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--background)] px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-bg)] font-sans text-[0.75rem] font-semibold text-[var(--accent)]">
        {getInitials(child.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[0.84rem] font-medium text-[var(--foreground)]">
          {child.name}
        </p>
        <p className="text-[0.72rem] text-[var(--muted)]">
          {getAge(child.bday)} yrs · {child.grade} · {child.gender}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="rounded p-1.5 text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--foreground)]"
        aria-label="Remove child"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
